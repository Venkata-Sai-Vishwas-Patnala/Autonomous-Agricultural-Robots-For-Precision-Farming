import { useState } from 'react'
import { Check, MapPinned, Plus, RotateCcw, Save, X } from 'lucide-react'
import type { Coordinate } from './types'

type CurrentGpsLocation = { latitude: number; longitude: number; accuracy: number }

type GpsBoundaryCaptureProps = {
  location: CurrentGpsLocation | null
  locationStatus: 'idle' | 'requesting' | 'watching' | 'error'
  locationError: string
  onStartGps: () => void
  onSaveBoundary: (name: string, ring: Coordinate[]) => void
}

function GpsBoundaryCapture({ location, locationStatus, locationError, onStartGps, onSaveBoundary }: GpsBoundaryCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [points, setPoints] = useState<Coordinate[]>([])
  const [boundaryName, setBoundaryName] = useState('GPS field boundary')
  const [captureError, setCaptureError] = useState('')

  const addPoint = () => {
    if (!location) return
    const point: Coordinate = [location.longitude, location.latitude]
    if (points.some(([longitude, latitude]) => longitude === point[0] && latitude === point[1])) {
      setCaptureError('This fix matches a point already recorded. Move to another field-edge point before recording again.')
      return
    }
    setPoints((current) => [...current, point])
    setCaptureError('')
  }

  const startCapture = () => {
    setPoints([])
    setCaptureError('')
    setIsCapturing(true)
    if (locationStatus !== 'watching') onStartGps()
  }

  const cancelCapture = () => {
    setPoints([])
    setCaptureError('')
    setIsCapturing(false)
  }

  const saveBoundary = () => {
    if (points.length < 3) {
      setCaptureError('Record at least three points around the field perimeter before saving.')
      return
    }
    const area = points.reduce((total, [longitude, latitude], index) => {
      const [nextLongitude, nextLatitude] = points[(index + 1) % points.length]
      return total + longitude * nextLatitude - nextLongitude * latitude
    }, 0)
    if (Math.abs(area) < 1e-12) {
      setCaptureError('These points do not enclose an area. Record points around the field perimeter.')
      return
    }
    const ring: Coordinate[] = [...points, points[0]]
    onSaveBoundary(boundaryName.trim() || 'GPS field boundary', ring)
    setPoints([])
    setIsCapturing(false)
    setCaptureError('')
  }

  return (
    <section className={`gps-boundary-panel ${isCapturing ? 'is-capturing' : ''}`} aria-labelledby="gps-boundary-title">
      <div className="gps-boundary-icon" aria-hidden="true"><MapPinned size={18} /></div>
      <div className="gps-boundary-content">
        <div className="gps-boundary-heading">
          <div>
            <p className="panel-kicker">GPS FIELD SETUP</p>
            <h2 id="gps-boundary-title">{isCapturing ? 'Walk and record the field edge' : 'Choose a field boundary with GPS'}</h2>
          </div>
          {isCapturing && <span className="gps-capture-count">{points.length} point{points.length === 1 ? '' : 's'}</span>}
        </div>
        <p className="gps-boundary-description">{isCapturing
          ? 'Stand at each corner or direction change and record a point. The first point is connected to the last when you save.'
          : 'Walk the field perimeter and record GPS points to create a locally saved map boundary. You can also import an existing GeoJSON boundary.'}</p>

        {isCapturing && <>
          <label className="gps-boundary-name">Boundary name<input value={boundaryName} onChange={(event) => setBoundaryName(event.target.value)} maxLength={60} /></label>
          {points.length > 0 && <ol className="gps-point-list" aria-label="Captured perimeter points">{points.map(([longitude, latitude], index) => <li key={`${index}-${longitude}-${latitude}`}><span>{index + 1}</span><code>{latitude.toFixed(6)}, {longitude.toFixed(6)}</code></li>)}</ol>}
          <p className="gps-current-readout" aria-live="polite">{location
            ? <>Current fix: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)} · ±{Math.round(location.accuracy)} m</>
            : locationStatus === 'requesting' ? 'Waiting for location permission and the first GPS fix…' : 'Waiting for device GPS. Allow location access to record points.'}</p>
        </>}

        {(locationError || captureError) && <p className="inline-error" role="alert">{captureError || locationError}</p>}
        <div className="gps-boundary-actions">
          {!isCapturing ? <button className="button button-primary" type="button" onClick={startCapture}><MapPinned size={15} /> Capture boundary with GPS</button> : <>
            <button className="button button-primary" type="button" disabled={!location} onClick={addPoint}><Plus size={15} /> Record current point</button>
            <button className="button button-subtle" type="button" disabled={points.length < 3} onClick={saveBoundary}><Save size={14} /> Save boundary</button>
            <button className="button button-subtle gps-reset-button" type="button" disabled={!points.length} aria-label="Reset captured points" title="Reset captured points" onClick={() => setPoints([])}><RotateCcw size={14} /></button>
            <button className="button button-subtle gps-cancel-button" type="button" onClick={cancelCapture}><X size={14} /> Cancel</button>
          </>}
          {isCapturing && points.length >= 3 && <span className="gps-ready-label"><Check size={13} /> Ready to close and save</span>}
        </div>
        <p className="gps-boundary-caveat">Phone GPS may drift by several metres and its reported accuracy is an estimate. Use RTK or a surveyed boundary for precision agriculture, legal acreage, or robot navigation.</p>
      </div>
    </section>
  )
}

export default GpsBoundaryCapture
