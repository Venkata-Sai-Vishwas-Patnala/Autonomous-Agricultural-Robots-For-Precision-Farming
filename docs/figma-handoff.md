# Figma Handoff

This blueprint mirrors the current React component structure. The repository has no connected Figma document or plugin; create the Figma file from these source-aligned foundations.

## Suggested pages

1. **00 Foundations**: color variables, type styles, spacing, radii, elevation, and icon sizing.
2. **01 Components**: reusable controls and status patterns with variants.
3. **02 Application shell**: floating feature-navigation capsule, responsive top bar, sensor-status indicator, and notification popover.
4. **03 Feature screens**: Live overview, GNSS + RTK field map, Hardware connections, Mission drafts, Crop camera analysis, and Research references.
5. **04 Prototype flows**: serial port selection/identity handshake, device-GPS permission and accuracy state, GeoJSON boundary import, camera permission/capture, local leaf classification, camera-distance calibration, and local mission draft creation.

## Variable collections

Create a `Color` collection and mirror the names and values from `src/shared/styles/tokens.css`: `canvas`, `surface`, `surface-raised`, `ink-900`, `ink-700`, `ink-500`, `line`, `forest-950`, `forest-800`, `forest-600`, `lime-400`, `lime-200`, `sun-500`, `sun-100`, `coral-500`, `coral-100`, `blue-500`, and `blue-100`.

Create a `Dimensions` collection for `space-1` through `space-8` and `radius-sm`, `radius-md`, and `radius-lg`. Create text styles for the Georgia-based display headings and Trebuchet-based interface labels/body copy. The source CSS remains authoritative if token values change.

## Component set

- `Floating navigation item`: default, hover, active, keyboard focus; icon + visible label. Use one persistent capsule across desktop and mobile; allow horizontal scrolling on narrow viewports so every destination stays reachable.
- `Button`: primary and subtle; default, hover, focus, and disabled.
- `Metric`: green, yellow, blue, and coral icon tones.
- `Sensor card`: disconnected, requesting, waiting for identity, connected, and error.
- `Notice`: missing device requirement, model limitation, and measurement caveat.
- `Panel heading`: kicker, title, and optional action.
- `Camera stage`: permission denied, camera off, live preview, captured image, and inference loading/error/result.
- `Mission draft`: survey/treatment and local saved/deleted states.
- `Connection gate`: required sensor name, identity handshake state, and connect/cancel/disconnect actions.

Use auto layout and component properties for labels, icons, tone, and status. Keep cards at the compact radius and restrained border treatment used in the interface.

## Frames and responsive behavior

Start with a desktop operations frame at 1440 x 900 and a mobile frame at 390 x 844. Use the same floating navigation capsule on both: centered near the bottom on desktop and inset from the safe area on mobile. On mobile, keep all six labeled destinations reachable with horizontal scrolling, sensor cards stacked, and camera controls reachable. Show unavailable states when required sensor handshakes or model endpoints are absent.

The field map uses an uploaded GeoJSON boundary and device-reported GNSS coordinates. Keep all research-reference numbers separate from live sensor data. Camera disease screening must retain its PlantVillage domain-shift notice; camera-derived soil and range results require their stated sensors or calibration.
