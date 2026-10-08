# Sensor Bridge Contract

The web application uses the browser Web Serial API. It opens a user-selected serial port at 115200 baud and does not report a sensor as connected until it receives a newline-delimited JSON frame whose `sensorId` exactly matches the sensor card and whose `connected` value is `true`.

## Frame format

```json
{"sensorId":"gnss-rtk","connected":true,"reading":{"latitude":37.421999,"longitude":-122.084057,"fixType":"RTK_FIXED","accuracyM":0.02}}
```

The frame must end with `\n`. Send status frames periodically so the browser can detect a dropped connection. A matching `connected: false` frame marks that sensor disconnected. Unknown IDs and invalid JSON are ignored.

## Sensor IDs and useful reading fields

- `gnss-rtk`: numeric `latitude`, `longitude`, `accuracyM`, and a fix type such as `RTK_FIXED`.
- `imu`: `yawDeg`, `pitchDeg`, `rollDeg`, and/or angular-rate values with documented units.
- `depth-camera`: calibrated `distanceM` or a depth stream with a documented coordinate frame.
- `soil-probe`: `moisturePercent`, `ecMsCm`, and/or `ph`, each calibrated and unit-tagged by the adapter.
- `obstacle-sensor`: numeric `rangeM` plus sensor validity/heartbeat fields.
- `robot-control`: `robotId`, command-link health, emergency-stop state, and telemetry identity.

Example soil-probe frame:

```json
{"sensorId":"soil-probe","connected":true,"reading":{"moisturePercent":24.6,"ecMsCm":0.31,"ph":6.4}}
```

## Browser and safety limits

Web Serial requires a supported Chromium browser and a secure context such as `localhost` or HTTPS. The user must select each port through the browser permission prompt. A port selection alone is not proof of sensor identity; the matching frame is required.

Device location is a separate option using the browser Geolocation API. The map requests permission only after the user starts GPS boundary capture or chooses **Allow device GPS**, updates the location while the map is open, and stops watching when they leave the page. During boundary capture, record at least three perimeter points; the app closes the ring and saves the resulting GeoJSON boundary in this browser. Browser geolocation may use GPS, Wi-Fi, or network positioning and reports its estimated horizontal accuracy; it must not be treated as RTK or used for survey-grade boundaries.

This bridge currently reads telemetry only. It does not send motion, spraying, or other actuator commands. Mission drafts are stored in the current browser only. Do not connect actuator control until authentication, geofencing, watchdogs, emergency stop, command acknowledgements, and hardware-in-the-loop tests are implemented for the selected robot.
