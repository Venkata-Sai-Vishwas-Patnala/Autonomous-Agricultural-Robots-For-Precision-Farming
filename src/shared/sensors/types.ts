export type SensorId = 'gnss-rtk' | 'imu' | 'depth-camera' | 'soil-probe' | 'obstacle-sensor' | 'robot-control'

export type SensorStatus = 'disconnected' | 'requesting' | 'waiting' | 'connected' | 'error'

export type SensorSnapshot = {
  status: SensorStatus
  lastSeen?: string
  reading?: Record<string, unknown>
  error?: string
}

export type SensorCatalogItem = {
  id: SensorId
  name: string
  purpose: string
  requirement: string
}

export const sensorCatalog: SensorCatalogItem[] = [
  { id: 'gnss-rtk', name: 'GNSS + RTK receiver', purpose: 'Position and field mapping', requirement: 'Fixed RTK solution with latitude, longitude, and accuracy in each status frame.' },
  { id: 'imu', name: 'IMU', purpose: 'Heading and motion estimation', requirement: 'Orientation or angular-rate values from the connected robot.' },
  { id: 'depth-camera', name: 'Depth camera', purpose: 'Metric range and distance', requirement: 'Calibrated depth values in metres; RGB-only cameras do not provide metric range.' },
  { id: 'soil-probe', name: 'Soil probe', purpose: 'Moisture and soil measurements', requirement: 'Sensor-reported moisture, EC, or pH values with units.' },
  { id: 'obstacle-sensor', name: 'LiDAR / obstacle sensor', purpose: 'Obstacle clearance and safety', requirement: 'Range readings with units and a valid sensor heartbeat.' },
  { id: 'robot-control', name: 'Robot control link', purpose: 'Robot telemetry and mission commands', requirement: 'Authenticated command/telemetry bridge with an emergency-stop path.' },
]

export const sensorIds = sensorCatalog.map(({ id }) => id)