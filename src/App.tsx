import AppShell from './app/AppShell'
import { SensorProvider } from './shared/sensors/SensorProvider'
import './shared/styles/app.css'
import './shared/styles/live.css'
import './shared/styles/floating-navigation.css'
import './shared/styles/field-map.css'
import './shared/styles/gps-boundary.css'

function App() {
  return <SensorProvider><AppShell /></SensorProvider>
}

export default App
