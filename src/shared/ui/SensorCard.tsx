import { Check, Plug, Unplug } from 'lucide-react'
import { useSensors } from '../sensors/useSensors'
import { sensorCatalog, type SensorId } from '../sensors/types'

function SensorCard({ sensorId }: { sensorId: SensorId }) {
  const { sensors, connectSensor, disconnectSensor } = useSensors()
  const sensor = sensors[sensorId]
  const definition = sensorCatalog.find(({ id }) => id === sensorId)!
  const connected = sensor.status === 'connected'
  const busy = sensor.status === 'requesting'

  return (
    <article className={`sensor-card sensor-${sensor.status}`}>
      <div className="sensor-card-top">
        <span className="sensor-state-indicator" />
        <span className="sensor-state-label">{sensor.status === 'connected' ? 'Connected' : sensor.status === 'waiting' ? 'Waiting for device data' : sensor.status === 'requesting' ? 'Choose serial port' : sensor.status === 'error' ? 'Connection needed' : 'Not connected'}</span>
      </div>
      <h3>{definition.name}</h3>
      <p>{definition.purpose}</p>
      <p className="sensor-requirement-note">{definition.requirement}</p>
      {sensor.error && <p className="sensor-error">{sensor.error}</p>}
      {sensor.status === 'waiting' && <p className="sensor-hint">Port open. Waiting for a valid {sensorId} handshake.</p>}
      {connected && sensor.lastSeen && <p className="sensor-hint">Last packet {new Date(sensor.lastSeen).toLocaleTimeString()}</p>}
      <button className={connected || sensor.status === 'waiting' ? 'button button-subtle sensor-connect-button' : 'button button-primary sensor-connect-button'} type="button" disabled={busy} onClick={() => connected || sensor.status === 'waiting' ? void disconnectSensor(sensorId) : void connectSensor(sensorId)}>
        {connected ? <Unplug size={14} /> : busy ? <Plug size={14} /> : <Plug size={14} />}
        {connected ? 'Disconnect' : sensor.status === 'waiting' ? 'Cancel connect' : busy ? 'Connecting…' : `Connect ${definition.name}`}
      </button>
      {connected && <span className="sensor-check"><Check size={14} /> Verified handshake</span>}
    </article>
  )
}

export default SensorCard