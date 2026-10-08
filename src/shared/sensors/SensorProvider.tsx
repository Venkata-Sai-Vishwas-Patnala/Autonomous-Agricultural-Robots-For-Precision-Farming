import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SensorContext } from './SensorContext'
import type { SensorId, SensorSnapshot } from './types'

type SerialPortLike = {
  open: (options: { baudRate: number }) => Promise<void>
  close: () => Promise<void>
  readable: ReadableStream<Uint8Array> | null
}

type SerialApiLike = {
  requestPort: () => Promise<SerialPortLike>
}

type SensorFrame = {
  sensorId?: string
  connected?: boolean
  reading?: Record<string, unknown>
}

const emptySnapshot = (): SensorSnapshot => ({ status: 'disconnected' })
const initialSensors: Record<SensorId, SensorSnapshot> = {
  'gnss-rtk': emptySnapshot(),
  imu: emptySnapshot(),
  'depth-camera': emptySnapshot(),
  'soil-probe': emptySnapshot(),
  'obstacle-sensor': emptySnapshot(),
  'robot-control': emptySnapshot(),
}

export function SensorProvider({ children }: { children: ReactNode }) {
  const [sensors, setSensors] = useState(initialSensors)
  const ports = useRef(new Map<SensorId, { port: SerialPortLike; reader: ReadableStreamDefaultReader<Uint8Array> }>())

  const updateSensor = (sensorId: SensorId, snapshot: SensorSnapshot) => {
    setSensors((current) => ({ ...current, [sensorId]: snapshot }))
  }

  const disconnectSensor = async (sensorId: SensorId) => {
    const connection = ports.current.get(sensorId)
    ports.current.delete(sensorId)
    if (connection) {
      await connection.reader.cancel().catch(() => undefined)
      connection.reader.releaseLock()
      await connection.port.close().catch(() => undefined)
    }
    updateSensor(sensorId, emptySnapshot())
  }

  const connectSensor = async (sensorId: SensorId) => {
    const serial = (navigator as Navigator & { serial?: SerialApiLike }).serial
    if (!serial) {
      updateSensor(sensorId, { status: 'error', error: 'Web Serial is unavailable here. Use Chrome or Edge on localhost/HTTPS.' })
      return
    }

    updateSensor(sensorId, { status: 'requesting' })
    try {
      const port = await serial.requestPort()
      await port.open({ baudRate: 115200 })
      if (!port.readable) throw new Error('This port does not expose a readable serial stream.')
      const reader = port.readable.getReader()
      ports.current.set(sensorId, { port, reader })
      updateSensor(sensorId, { status: 'waiting' })

      void (async () => {
        const decoder = new TextDecoder()
        let buffer = ''
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split(/\r?\n/)
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.trim()) continue
              let frame: SensorFrame
              try {
                frame = JSON.parse(line) as SensorFrame
              } catch {
                continue
              }
              if (frame.sensorId !== sensorId || typeof frame.connected !== 'boolean') continue
              updateSensor(sensorId, frame.connected
                ? { status: 'connected', lastSeen: new Date().toISOString(), reading: frame.reading ?? {} }
                : { status: 'disconnected', reading: frame.reading ?? {} })
            }
          }
        } catch (error) {
          if (ports.current.has(sensorId)) {
            updateSensor(sensorId, { status: 'error', error: error instanceof Error ? error.message : 'Serial read failed.' })
          }
        } finally {
          reader.releaseLock()
          if (ports.current.has(sensorId)) {
            ports.current.delete(sensorId)
            await port.close().catch(() => undefined)
            updateSensor(sensorId, emptySnapshot())
          }
        }
      })()
    } catch (error) {
      updateSensor(sensorId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unable to open the selected sensor port.',
      })
    }
  }

  useEffect(() => () => {
    for (const connection of ports.current.values()) {
      void connection.reader.cancel().catch(() => undefined)
      void connection.port.close().catch(() => undefined)
    }
    ports.current.clear()
  }, [])

  return <SensorContext.Provider value={{ sensors, connectSensor, disconnectSensor }}>{children}</SensorContext.Provider>
}