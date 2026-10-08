import { useContext } from 'react'
import { SensorContext } from './SensorContext'

export function useSensors() {
  const value = useContext(SensorContext)
  if (!value) throw new Error('useSensors must be used inside SensorProvider.')
  return value
}