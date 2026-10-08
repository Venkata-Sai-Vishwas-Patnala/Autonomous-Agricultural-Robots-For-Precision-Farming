import { ArrowRight, BatteryCharging, Compass, Droplets, MapPinned, Radio, Satellite, ShieldAlert, Sprout, Tractor } from 'lucide-react'
import type { PageKey } from '../../app/navigation'
import { useSensors } from '../../shared/sensors/useSensors'
import { sensorCatalog } from '../../shared/sensors/types'
import MetricCard from '../../shared/ui/MetricCard'
import PageHeading from '../../shared/ui/PageHeading'

type OverviewPageProps = { onNavigate: (page: PageKey) => void }

function OverviewPage({ onNavigate }: OverviewPageProps) {
  const { sensors } = useSensors()
  const connected = Object.values(sensors).filter((sensor) => sensor.status === 'connected').length
  const rtk = sensors['gnss-rtk']
  const soil = sensors['soil-probe']
  const obstacle = sensors['obstacle-sensor']
  const position = rtk.reading
  const latitude = typeof position?.latitude === 'number' ? position.latitude.toFixed(6) : null
  const longitude = typeof position?.longitude === 'number' ? position.longitude.toFixed(6) : null
  const moisture = typeof soil.reading?.moisturePercent === 'number' ? `${soil.reading.moisturePercent}%` : null

  return (
    <div className="page-stack">
      <PageHeading eyebrow="Field system status" title="Live operations" description="This workspace only reports values received from verified sensor connections. Connect the hardware you need to unlock each feature." action={<button className="button button-primary" type="button" onClick={() => onNavigate('fleet')}><Radio size={15} /> Connect sensors</button>} />
      <div className="notice-banner live-data-notice" role="status"><span className="notice-symbol"><ShieldAlert size={16} /></span><span><strong>{connected} of {sensorCatalog.length} sensor links verified.</strong> No telemetry or analysis is fabricated when devices are offline.</span></div>

      <section className="metric-grid" aria-label="Live system availability">
        <MetricCard label="Verified sensor links" value={`${connected} / ${sensorCatalog.length}`} detail="Live serial handshakes" icon={Radio} tone="green" />
        <MetricCard label="GNSS + RTK position" value={latitude && longitude ? `${latitude}, ${longitude}` : 'Unavailable'} detail={rtk.status === 'connected' ? 'Device position frame' : 'Connect GNSS + RTK'} icon={MapPinned} tone="yellow" />
        <MetricCard label="Soil moisture" value={moisture ?? 'Unavailable'} detail={moisture ? 'Soil probe reading' : 'Camera cannot measure moisture'} icon={Droplets} tone="blue" />
        <MetricCard label="Obstacle clearance" value={obstacle.status === 'connected' ? 'Receiving' : 'Unavailable'} detail={obstacle.status === 'connected' ? 'Range sensor connected' : 'Connect LiDAR / obstacle sensor'} icon={ShieldAlert} tone="coral" />
      </section>

      <div className="dashboard-grid live-dashboard-grid">
        <section className="panel live-map-panel">
          <div className="panel-heading"><div><p className="panel-kicker">LIVE POSITION</p><h2>Field map</h2></div><button className="button button-subtle" type="button" onClick={() => onNavigate('field-map')}>Open map <ArrowRight size={14} /></button></div>
          <div className="live-empty-map"><div className="live-empty-symbol"><Satellite size={23} /></div><strong>{rtk.status === 'connected' ? 'Field boundary required' : 'GNSS + RTK not connected'}</strong><p>{rtk.status === 'connected' ? 'Upload a GeoJSON field boundary to see the live position against your field.' : 'Connect a GNSS + RTK receiver and upload a field boundary to unlock live mapping.'}</p><button className="text-action" type="button" onClick={() => onNavigate('field-map')}>Configure map <ArrowRight size={14} /></button></div>
        </section>

        <section className="panel readiness-panel">
          <div className="panel-heading"><div><p className="panel-kicker">FEATURE READINESS</p><h2>What is available</h2></div></div>
          <div className="readiness-list">
            <div><span className={`readiness-indicator ${rtk.status === 'connected' ? 'is-ready' : ''}`} /><span><strong>Live field position</strong><small>{rtk.status === 'connected' ? 'GNSS + RTK handshake verified' : 'Requires GNSS + RTK receiver'}</small></span><Satellite size={16} /></div>
            <div><span className={`readiness-indicator ${sensors['robot-control'].status === 'connected' ? 'is-ready' : ''}`} /><span><strong>Mission execution</strong><small>{sensors['robot-control'].status === 'connected' ? 'Control link verified; safety checks still required' : 'Requires robot-control link and safety sensors'}</small></span><Compass size={16} /></div>
            <div><span className="readiness-indicator is-ready" /><span><strong>Leaf disease screening</strong><small>Camera photo + local PlantVillage model</small></span><Sprout size={16} /></div>
            <div><span className={`readiness-indicator ${soil.status === 'connected' ? 'is-ready' : ''}`} /><span><strong>Measured soil values</strong><small>{soil.status === 'connected' ? 'Soil probe connected' : 'Requires a soil probe; RGB image is not a soil sensor'}</small></span><Droplets size={16} /></div>
          </div>
          <button className="activity-link" type="button" onClick={() => onNavigate('fleet')}>Manage hardware connections <ArrowRight size={14} /></button>
        </section>
      </div>

      <section className="panel no-telemetry-panel"><span className="empty-activity-icon"><BatteryCharging size={18} /></span><div><p className="panel-kicker">ROBOT ACTIVITY</p><h2>No robot events received</h2><p>Connect a robot-control and telemetry link. Activity, battery, coverage, and mission state will appear here only after the device sends readings.</p></div><button className="button button-subtle" type="button" onClick={() => onNavigate('fleet')}><Tractor size={15} /> Hardware setup</button></section>
    </div>
  )
}

export default OverviewPage