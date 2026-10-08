import { useState } from 'react'
import { Bell, Leaf } from 'lucide-react'
import { navigationGroups, type PageKey } from './navigation'
import OverviewPage from '../features/overview/OverviewPage'
import FieldMapPage from '../features/field-map/FieldMapPage'
import FleetPage from '../features/fleet/FleetPage'
import MissionsPage from '../features/missions/MissionsPage'
import ScoutingPage from '../features/scouting/ScoutingPage'
import ResearchPage from '../features/research/ResearchPage'
import { useSensors } from '../shared/sensors/useSensors'
import { sensorCatalog } from '../shared/sensors/types'

function AppShell() {
  const [activePage, setActivePage] = useState<PageKey>('overview')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { sensors } = useSensors()
  const connectedSensorCount = Object.values(sensors).filter((sensor) => sensor.status === 'connected').length
  const pageLabel = navigationGroups.flatMap((group) => group.items)
    .find((item) => item.key === activePage)?.label ?? 'Overview'
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  const navigate = (page: PageKey) => setActivePage(page)

  return (
    <div className="app-shell">
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-identity">
            <a className="brand" href="#overview" aria-label="Autonomous Agriculture overview" onClick={(event) => {
              event.preventDefault()
              navigate('overview')
            }}>
              <span className="brand-mark"><Leaf size={18} strokeWidth={2} /></span>
              <span className="brand-copy"><span className="brand-name">Autonomous Agriculture</span><span className="brand-caption">PRECISION FARMING</span></span>
            </a>
            <span className="topbar-identity-divider" />
            <div className="breadcrumb"><span>Farm workspace</span><span className="breadcrumb-divider">/</span><strong>{pageLabel}</strong></div>
          </div>
          <div className="topbar-tools">
            <span className="topbar-date">{formattedDate}</span>
            <span className="topbar-separator" />
            <span className="demo-status"><span className={`status-dot ${connectedSensorCount ? '' : 'status-dot-off'}`} />{connectedSensorCount} / {sensorCatalog.length} sensors online</span>
            <button className="icon-button notification-button" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>
              <Bell size={17} strokeWidth={1.8} />
              <span className="notification-dot" />
            </button>
            <span className="mobile-profile" aria-label="Field operator">FO</span>
          </div>
          {notificationsOpen && <div className="notification-popover" role="status"><strong>{connectedSensorCount ? 'Sensor connections active' : 'No sensor data available'}</strong><span>{connectedSensorCount} of {sensorCatalog.length} verified sensor links are active.</span><button type="button" onClick={() => setNotificationsOpen(false)}>Dismiss</button></div>}
        </header>

        <main className="main-content" key={activePage}>
          {activePage === 'overview' && <OverviewPage onNavigate={navigate} />}
          {activePage === 'field-map' && <FieldMapPage />}
          {activePage === 'fleet' && <FleetPage />}
          {activePage === 'missions' && <MissionsPage />}
          {activePage === 'scouting' && <ScoutingPage />}
          {activePage === 'research' && <ResearchPage />}
          <footer className="content-footer">
            <span>Precision agriculture · Field systems</span>
            <span>Sensor readings are shown only after device verification</span>
          </footer>
        </main>
      </div>
      <nav className="floating-navigation" aria-label="Feature navigation">
        {navigationGroups.map((group, groupIndex) => (
          <div className="floating-nav-group" key={group.label} aria-label={group.label}>
            {group.items.map(({ key, label, icon: Icon }) => (
              <button
                className={`floating-nav-item ${activePage === key ? 'is-active' : ''}`}
                key={key}
                type="button"
                aria-label={label}
                aria-current={activePage === key ? 'page' : undefined}
                onClick={() => navigate(key)}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
            {groupIndex < navigationGroups.length - 1 && <span className="floating-nav-divider" aria-hidden="true" />}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default AppShell