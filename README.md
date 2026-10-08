# Autonomous Agriculture for Precision Farming

Autonomous Agriculture for Precision Farming is a sensor-aware field-operations application for autonomous agricultural robotics. It never fills offline device states with simulated readings.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Camera access works on `localhost` or HTTPS. Web Serial sensor connections require a supported Chromium browser and a device that implements the JSON-lines bridge in [docs/sensor-bridge.md](docs/sensor-bridge.md).

Run the production checks:

```sh
npm run build
npm run lint
```

## Features

- **Overview:** Verified sensor count, live GNSS position and soil probe values when received, plus unavailable states and per-feature prerequisites.
- **Field map:** Requests device geolocation on user action or uses GNSS + RTK when available. Walk the field edge and record GPS points to create a locally saved Polygon, or import a GeoJSON boundary. Device GPS accuracy varies and is not RTK-grade; no synthetic boundary or route is displayed.
- **Hardware:** Connects selected serial devices and waits for a matching sensor identity/heartbeat before reporting them connected.
- **Mission drafts:** Saves local survey/treatment drafts. It does not issue robot movement or actuator commands.
- **Crop camera analysis:** Captures a browser camera image or accepts a photo, then runs the public CropGuard PlantVillage classifier locally in the browser. The checkpoint downloads on first inference.
- **Soil surface:** Captures an image, but analysis remains unavailable until a documented soil-image model endpoint is configured. Measured moisture, pH, and conductivity require a soil probe.
- **Camera distance:** Calibrates from a known-size reference at a known distance, then estimates a known-width target. It is not a safety-grade range sensor.
- **Research references:** Keeps the presentation's approximate values separate from live sensor state.

## Real data and limitations

The CropGuard checkpoint is trained on the PlantVillage leaf dataset. Its published model card describes detached leaves against plain backgrounds and says field-photo performance is not established. The result is a screening suggestion, not a confirmed disease diagnosis or treatment instruction. PlantDoc is linked as a field-image dataset for future evaluation; it is not used to train the connected checkpoint. See [docs/crop-model-and-measurements.md](docs/crop-model-and-measurements.md).

The original presentation's navigation, detection, water, coverage, and battery values are retained only as clearly labeled approximate research references. They are not reported as current field measurements.

## Architecture

Feature screens live under `src/features/`; navigation and the app shell are in `src/app/`; sensor state and shared UI live in `src/shared/`. CSS variables in `src/shared/styles/tokens.css` remain the design-token source of truth. See [docs/figma-handoff.md](docs/figma-handoff.md) for the component/variable handoff.

An actual robot deployment still needs hardware-specific firmware adapters, authenticated command transport, emergency-stop integration, geofence validation, safety interlocks, and field validation before mission execution is implemented.
