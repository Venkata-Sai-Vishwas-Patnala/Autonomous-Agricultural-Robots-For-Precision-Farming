import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, CircleAlert, Compass, Plus, Sprout, SprayCan, X } from 'lucide-react'
import PageHeading from '../../shared/ui/PageHeading'
import SensorCard from '../../shared/ui/SensorCard'
import { useSensors } from '../../shared/sensors/useSensors'
import type { SensorId } from '../../shared/sensors/types'

type MissionDraft = { id: string; name: string; type: 'survey' | 'treatment'; createdAt: string }
const requiredSensors: SensorId[] = ['gnss-rtk', 'imu', 'obstacle-sensor', 'robot-control']
const missionStorageKey = 'precision-farm-mission-drafts'

function readDrafts(): MissionDraft[] {
  try {
    const saved = localStorage.getItem(missionStorageKey)
    return saved ? JSON.parse(saved) as MissionDraft[] : []
  } catch {
    return []
  }
}

function MissionsPage() {
  const [missions, setMissions] = useState<MissionDraft[]>(readDrafts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<MissionDraft['type']>('survey')
  const { sensors } = useSensors()
  const missingSensors = requiredSensors.filter((sensorId) => sensors[sensorId].status !== 'connected')
  const canExecute = missingSensors.length === 0

  useEffect(() => { localStorage.setItem(missionStorageKey, JSON.stringify(missions)) }, [missions])

  const addMission = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return
    setMissions((current) => [{ id: crypto.randomUUID(), name: title.trim(), type: kind, createdAt: new Date().toISOString() }, ...current])
    setTitle('')
    setIsDialogOpen(false)
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="Mission planning" title="Mission drafts" description="Plan survey and treatment work locally. This app does not send movement or actuator commands to a robot." action={<button className="button button-primary" type="button" onClick={() => setIsDialogOpen(true)}><Plus size={16} /> New draft</button>} />
      <section className={`execution-gate ${canExecute ? 'gate-ready' : ''}`}><span className="gate-icon">{canExecute ? <Check size={17} /> : <CircleAlert size={17} />}</span><div><strong>{canExecute ? 'Required sensor links verified' : 'Mission execution unavailable'}</strong><p>{canExecute ? 'Sensor handshakes are present. Robot command transport and emergency-stop validation are still required before execution.' : `Connect ${missingSensors.map((id) => id === 'gnss-rtk' ? 'GNSS + RTK' : id === 'obstacle-sensor' ? 'LiDAR / obstacle sensor' : id === 'robot-control' ? 'robot-control link' : 'IMU').join(', ')} to access mission preflight.`}</p></div></section>
      <div className="mission-requirement-grid">{missingSensors.map((sensorId) => <SensorCard key={sensorId} sensorId={sensorId} />)}</div>
      <section className="panel mission-panel"><div className="panel-heading"><div><p className="panel-kicker">LOCAL DEVICE STORAGE</p><h2>Draft queue</h2></div><span className="mini-tag">{missions.length} draft{missions.length === 1 ? '' : 's'}</span></div>
        {missions.length ? <div className="mission-list">{missions.map((mission) => <article className="mission-row draft-row" key={mission.id}><span className={`mission-kind kind-${mission.type}`}>{mission.type === 'survey' ? <Sprout size={17} /> : <SprayCan size={17} />}</span><div className="mission-info"><strong>{mission.name}</strong><span>{mission.type === 'survey' ? 'Crop survey' : 'Precision treatment'} <i /> Created {new Date(mission.createdAt).toLocaleString()}</span></div><span className="status-tag status-idle"><i />Draft</span><button className="icon-button" type="button" aria-label={`Delete ${mission.name}`} onClick={() => setMissions((current) => current.filter(({ id }) => id !== mission.id))}><X size={15} /></button></article>)}</div> : <div className="empty-mission-state"><span><Compass size={22} /></span><strong>No mission drafts</strong><p>Create a local draft. It will not be sent to hardware.</p><button className="button button-subtle" type="button" onClick={() => setIsDialogOpen(true)}><Plus size={14} /> Create draft</button></div>}
      </section>
      {isDialogOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsDialogOpen(false) }}><section className="mission-dialog" role="dialog" aria-modal="true" aria-labelledby="mission-dialog-title"><div className="dialog-heading"><div><p className="panel-kicker">LOCAL PLAN</p><h2 id="mission-dialog-title">Create a mission draft</h2></div><button className="icon-button" type="button" aria-label="Close dialog" onClick={() => setIsDialogOpen(false)}><X size={17} /></button></div><form onSubmit={addMission}><label className="form-label">Mission name<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. North block crop survey" required /></label><fieldset className="mission-type-choice"><legend>Plan type</legend><label className={kind === 'survey' ? 'choice-selected' : ''}><input type="radio" name="mission-type" checked={kind === 'survey'} onChange={() => setKind('survey')} /><Sprout size={16} /> Crop survey</label><label className={kind === 'treatment' ? 'choice-selected' : ''}><input type="radio" name="mission-type" checked={kind === 'treatment'} onChange={() => setKind('treatment')} /><SprayCan size={16} /> Precision treatment</label></fieldset><div className="dialog-actions"><button className="button button-subtle" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</button><button className="button button-primary" type="submit">Save local draft <ArrowRight size={15} /></button></div></form></section></div>}
    </div>
  )
}

export default MissionsPage