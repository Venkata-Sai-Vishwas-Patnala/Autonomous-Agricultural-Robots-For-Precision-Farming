import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Crosshair, FileUp, MapPin, MapPinned, Satellite, Trash2 } from 'lucide-react'
import { useSensors } from '../../shared/sensors/useSensors'
import SensorCard from '../../shared/ui/SensorCard'
import PageHeading from '../../shared/ui/PageHeading'
import GpsBoundaryCapture from './GpsBoundaryCapture'
import type { Coordinate } from './types'

type DeviceLocation = { latitude: number; longitude: number; accuracy: number }
type SavedBoundary = { name: string; ring: Coordinate[] }
type GeoJson = {
  type?: string
  coordinates?: Coordinate[][]
  geometry?: { type?: string; coordinates?: Coordinate[][] }
  features?: Array<{ geometry?: { type?: string; coordinates?: Coordinate[][] } }>
}

const boundaryStorageKey = 'precision-farm-field-boundary'

function getBoundary(value: GeoJson): Coordinate[] | null {
  const geometry = value.type === 'FeatureCollection'
    ? value.features?.[0]?.geometry
    : value.type === 'Feature' ? value.geometry : value
  if (!geometry || geometry.type !== 'Polygon' || !geometry.coordinates?.[0]) return null
  return geometry.coordinates[0]
}

function readSavedBoundary(): SavedBoundary | null {
  try {
    const value = localStorage.getItem(boundaryStorageKey)
    if (!value) return null
    const saved = JSON.parse(value) as SavedBoundary
    if (typeof saved.name === 'string' && Array.isArray(saved.ring) && saved.ring.length >= 4) return saved
  } catch {
    return null
  }
  return null
}

function FieldMapPage() {
  const [savedBoundary, setSavedBoundary] = useState<SavedBoundary | null>(readSavedBoundary)
  const [fileError, setFileError] = useState('')
  const [deviceLocation, setDeviceLocation] = useState<DeviceLocation | null>(null)
  const [deviceGpsStatus, setDeviceGpsStatus] = useState<'idle' | 'requesting' | 'watching' | 'error'>('idle')
  const [deviceGpsError, setDeviceGpsError] = useState('')
  const watchId = useRef<number | null>(null)
  const { sensors } = useSensors()
  const hasRtk = sensors['gnss-rtk'].status === 'connected'
  const reading = sensors['gnss-rtk'].reading
  const rtkLatitude = typeof reading?.latitude === 'number' ? reading.latitude : null
  const rtkLongitude = typeof reading?.longitude === 'number' ? reading.longitude : null
  const useRtk = hasRtk && rtkLatitude !== null && rtkLongitude !== null
  const latitude = useRtk ? rtkLatitude : deviceLocation?.latitude ?? null
  const longitude = useRtk ? rtkLongitude : deviceLocation?.longitude ?? null
  const locationSource = useRtk ? 'GNSS + RTK' : deviceLocation ? 'Device GPS' : null
  const accuracy = useRtk
    ? typeof reading?.accuracyM === 'number' ? reading.accuracyM : null
    : deviceLocation?.accuracy ?? null
  const boundary = savedBoundary?.ring ?? null
  const boundaryName = savedBoundary?.name ?? ''
  const hasNoPosition = latitude === null || longitude === null

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
  }, [])

  const requestDeviceGps = () => {
    if (!navigator.geolocation) {
      setDeviceGpsStatus('error')
      setDeviceGpsError('This browser does not provide device geolocation.')
      return
    }
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = null
    setDeviceGpsStatus('requesting')
    setDeviceGpsError('')
    try {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setDeviceLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          })
          setDeviceGpsStatus('watching')
          setDeviceGpsError('')
        },
        (error) => {
          if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
          watchId.current = null
          setDeviceGpsStatus('error')
          setDeviceGpsError(error.message || 'Location permission was denied or unavailable.')
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
      )
    } catch (error) {
      setDeviceGpsStatus('error')
      setDeviceGpsError(error instanceof Error ? error.message : 'Device location could not be started.')
    }
  }

  const stopDeviceGps = () => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
    watchId.current = null
    setDeviceLocation(null)
    setDeviceGpsStatus('idle')
    setDeviceGpsError('')
  }

  const loadBoundary = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as GeoJson
      const ring = getBoundary(parsed)
      if (!ring || ring.length < 4) throw new Error('Use a GeoJSON Polygon or Feature with one exterior ring.')
      persistBoundary(file.name, ring)
      setFileError('')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'The boundary file could not be read.')
    }
  }

  const persistBoundary = (name: string, ring: Coordinate[]) => {
    const next = { name, ring }
    try {
      localStorage.setItem(boundaryStorageKey, JSON.stringify(next))
      setSavedBoundary(next)
      setFileError('')
    } catch {
      setFileError('The boundary could not be saved in this browser. Check available local storage.')
    }
  }

  const clearBoundary = () => {
    localStorage.removeItem(boundaryStorageKey)
    setSavedBoundary(null)
  }

  const bounds = boundary?.reduce((current, [lon, lat]) => ({ minLon: Math.min(current.minLon, lon), maxLon: Math.max(current.maxLon, lon), minLat: Math.min(current.minLat, lat), maxLat: Math.max(current.maxLat, lat) }), { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity })
  const project = (lon: number, lat: number) => {
    if (!bounds) return [0, 0]
    const width = Math.max(bounds.maxLon - bounds.minLon, 0.000001)
    const height = Math.max(bounds.maxLat - bounds.minLat, 0.000001)
    return [40 + ((lon - bounds.minLon) / width) * 520, 330 - ((lat - bounds.minLat) / height) * 280]
  }
  const polygonPoints = boundary?.map(([lon, lat]) => project(lon, lat).join(',')).join(' ')
  const robotPoint = latitude !== null && longitude !== null ? project(longitude, latitude) : null

  return (
    <div className="page-stack">
      <PageHeading eyebrow="Field operations" title="Field map" description="Use device GPS for an approximate location or connect GNSS + RTK for higher-accuracy field positioning." action={<label className="button button-subtle boundary-upload"><FileUp size={15} /> Upload GeoJSON<input className="visually-hidden" type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={loadBoundary} /></label>} />
      {fileError && <p className="inline-error" role="alert">{fileError}</p>}
      <GpsBoundaryCapture location={deviceLocation} locationStatus={deviceGpsStatus} locationError={deviceGpsError} onStartGps={requestDeviceGps} onSaveBoundary={persistBoundary} />
      <section className="panel live-field-map-panel"><div className="panel-heading"><div><p className="panel-kicker">{locationSource ?? 'FIELD BOUNDARY'}</p><h2>{boundaryName || 'Field boundary not loaded'}</h2></div><div className="map-panel-actions"><span className={`status-tag ${boundary ? 'status-working' : 'status-idle'}`}><i />{boundary ? locationSource ? 'Live position' : 'Boundary saved' : 'Boundary needed'}</span>{boundary && <button className="icon-button" type="button" aria-label="Remove saved field boundary" title="Remove saved field boundary" onClick={clearBoundary}><Trash2 size={15} /></button>}</div></div>
        {boundary && polygonPoints ? <div className="geo-map"><svg viewBox="0 0 600 380" role="img" aria-label={`${boundaryName} field boundary${locationSource ? ` and current ${locationSource} position` : ''}`}><polygon points={polygonPoints} />{robotPoint && <><circle cx={robotPoint[0]} cy={robotPoint[1]} r="9" /><circle cx={robotPoint[0]} cy={robotPoint[1]} r="3" /></>}</svg><div className="geo-map-coordinate">{robotPoint ? <><MapPin size={14} /> {latitude?.toFixed(6)}, {longitude?.toFixed(6)} <span>{accuracy === null ? locationSource : `${locationSource} · ±${Math.round(accuracy)} m`}</span></> : <span>Saved boundary · enable device GPS to show current location</span>}</div></div> : <div className="map-setup-grid"><div className="map-unavailable"><span><MapPinned size={23} /></span><strong>{hasNoPosition ? 'Choose a location source' : 'Upload or capture a field boundary'}</strong><p>{hasNoPosition ? 'Device GPS uses the browser location permission and may be approximate. GNSS + RTK is preferred for survey-grade field work.' : 'Import a GeoJSON Polygon or capture GPS points around the field perimeter.'}</p>{!boundary && <label className="button button-subtle boundary-upload"><FileUp size={14} /> Choose boundary<input className="visually-hidden" type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={loadBoundary} /></label>}{deviceGpsError && <p className="inline-error" role="alert">{deviceGpsError}</p>}</div><div className="map-requirement"><div className="device-gps-card"><div><p className="panel-kicker">PHONE / DEVICE LOCATION</p><h3>{deviceGpsStatus === 'watching' ? 'GPS location active' : deviceGpsStatus === 'requesting' ? 'Waiting for permission' : 'Use device GPS'}</h3><p>Browser location uses the device’s available location source. Accuracy varies and is not equivalent to RTK.</p>{deviceLocation && <span className="device-gps-accuracy">{deviceLocation.latitude.toFixed(6)}, {deviceLocation.longitude.toFixed(6)} · ±{Math.round(deviceLocation.accuracy)} m</span>}</div><button className={deviceGpsStatus === 'watching' ? 'button button-subtle' : 'button button-primary'} type="button" disabled={deviceGpsStatus === 'requesting'} onClick={deviceGpsStatus === 'watching' ? stopDeviceGps : requestDeviceGps}>{deviceGpsStatus === 'watching' ? <><Crosshair size={14} /> Stop GPS</> : <><Crosshair size={14} /> {deviceGpsStatus === 'requesting' ? 'Requesting…' : deviceGpsStatus === 'error' ? 'Retry device GPS' : 'Allow device GPS'}</>}</button>{deviceLocation && <span className="device-gps-accuracy">±{Math.round(deviceLocation.accuracy)} m reported accuracy</span>}</div><SensorCard sensorId="gnss-rtk" /></div></div>}
      </section>
      <div className="system-note"><Satellite size={14} /> RTK coordinates take priority when valid. Device GPS is an approximate fallback and is not survey-grade.</div>
    </div>
  )
}

export default FieldMapPage