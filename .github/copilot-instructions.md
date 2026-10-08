# Workspace Guidance

- Build the precision-farming application with React, TypeScript, and the existing feature-based structure.
- Keep screen-specific behavior in `src/features/<feature>/`; keep app navigation in `src/app/` and cross-feature UI in `src/shared/`.
- Treat the CSS custom properties in `src/shared/styles/tokens.css` as the source of truth for design colors, spacing, typography, and radii.
- Use Lucide icons for interface controls and preserve keyboard focus, accessible names, and responsive layouts.
- Never invent live sensor, robot, field, soil, or model values. Sensor links are disconnected until a matching serial identity frame arrives.
- Keep mission planning local-only. Do not add actuator commands before authenticated robot transport, emergency-stop behavior, geofencing, and safety interlocks are implemented and tested.
- Keep PlantVillage model limitations visible; RGB camera images do not measure soil chemistry or calibrated distance.
- Treat presentation metrics as approximate research references, never as current field telemetry.
- Run `npm run build` and `npm run lint` after meaningful changes.
