# Sensor Bridge Contract

This app reads user-selected Web Serial ports at 115200 baud. It reports a sensor connected only after receiving a newline-delimited JSON frame with an exact `sensorId` and `connected: true`.

```json
{"sensorId":"gnss-rtk","connected":true,"reading":{"latitude":37.421999,"longitude":-122.084057,"fixType":"RTK_FIXED","accuracyM":0.02}}
```

Supported IDs: `gnss-rtk`, `imu`, `depth-camera`, `soil-probe`, `obstacle-sensor`, `robot-control`. Sensor-specific reading fields and safety notes are in the project `docs/sensor-bridge.md` file.

A selected port is not enough to establish device identity. This application currently reads telemetry only; it does not issue robot or actuator commands. Use Chrome or Edge on localhost/HTTPS.
