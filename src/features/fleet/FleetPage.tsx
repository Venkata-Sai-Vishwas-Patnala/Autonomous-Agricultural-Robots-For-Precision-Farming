import { Radio, ShieldAlert } from 'lucide-react'
import PageHeading from '../../shared/ui/PageHeading'
import SensorCard from '../../shared/ui/SensorCard'
import { sensorCatalog } from '../../shared/sensors/types'

function FleetPage() {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="Hardware connections" title="Connect field equipment" description="Choose a device port, then wait for that exact sensor identity before live features unlock." action={<span className="mini-tag"><Radio size={13} /> Web Serial · 115200 baud</span>} />
      <section className="sensor-grid" aria-label="Available sensor connections">{sensorCatalog.map(({ id }) => <SensorCard key={id} sensorId={id} />)}</section>
      <section className="hardware-safety-note"><span><ShieldAlert size={17} /></span><p><strong>Connection is not a safety certification.</strong> Mission execution remains blocked until device identity, emergency-stop behavior, geofence, actuator interlocks, and the robot-control protocol are reviewed for your hardware.</p></section>
      <section className="panel sensor-protocol-panel"><div><p className="panel-kicker">DEVICE ADAPTER</p><h2>Serial bridge format</h2><p>The browser listens for newline-delimited JSON and marks a device connected only after a matching <code>sensorId</code> and <code>connected: true</code> message. See the bridge contract before adapting firmware.</p></div><a className="button button-subtle" href="/sensor-bridge.md" target="_blank" rel="noreferrer">Open bridge contract</a></section>
    </div>
  )
}

export default FleetPage