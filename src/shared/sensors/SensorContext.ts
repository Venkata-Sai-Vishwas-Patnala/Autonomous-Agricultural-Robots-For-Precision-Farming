import { createContext } from 'react'
import type { SensorId, SensorSnapshot } from './types'

export type SensorContextValue = {
  sensors: Record<SensorId, SensorSnapshot>
  connectSensor: (sensorId: SensorId) => Promise<void>
  disconnectSensor: (sensorId: SensorId) => Promise<void>
}

export const SensorContext = createContext<SensorContextValue | null>(null)