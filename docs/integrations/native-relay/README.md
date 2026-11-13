# NativeRelay Integration Workstream

This branch is the GLB Viewer-side point of contact for NativeRelay hardware integration.

- **GLB Viewer branch:** `integration/native-relay-hardware`
- **NativeRelay branch:** `glb-nativerelay-contract`
- **NativeRelay implementation prompt:** [NATIVERELAY_IMPLEMENTATION_PROMPT.md](./NATIVERELAY_IMPLEMENTATION_PROMPT.md)

## Responsibility split

NativeRelay collects and normalizes host hardware/system information. GLB Viewer consumes that information, independently detects browser/WebGL capabilities, measures actual rendering performance, and makes all adaptation decisions.

The browser viewer must continue to work when NativeRelay is unavailable. NativeRelay absence must never block loading or viewing a model.

## Integration sequence

1. Implement and validate the hardware contract in the NativeRelay branch.
2. Agree on the exact serialized response and supported operations.
3. Add a GLB Viewer adapter that validates the contract and normalizes missing/unsupported fields.
4. Add deterministic fixtures for desktop, battery-powered laptop, no-battery system, integrated GPU, multi-GPU, partial response and unavailable permissions.
5. Test the adapter against fixtures before connecting a live NativeRelay process.
6. Add a local-only transport/bridge only after the NativeRelay API and the existing Rust launcher/browser architecture have been reviewed together.
7. Verify that the viewer works normally when NativeRelay is missing, stopped, unsupported or returns a partial profile.

## Integration constraints

- Do not couple viewer modules to NativeRelay's internal Python implementation.
- Do not assume a browser page can directly import the NativeRelay Python package.
- Do not expose a network-accessible service. Any future bridge must bind to loopback only, have a narrowly scoped API, and avoid transmitting model contents or unrelated user data.
- Do not collect or transmit GLB files, scene data, usernames, serial numbers, MAC addresses or other unrelated identifiers.
- Do not treat hardware specifications as performance guarantees.
- Do not let NativeRelay make GLB Viewer feature decisions.
- Keep browser-only WebGL capability detection and real rendering measurements inside GLB Viewer.
- Preserve the existing viewer workflow and ensure no NativeRelay dependency is required for browser-only viewing.

## Acceptance criteria

- The contract is versioned and schema-validated.
- GLB Viewer can parse a valid profile and a valid partial profile.
- Unknown values remain unknown; they are not converted to zero or optimistic defaults.
- Battery absence is distinguishable from unavailable battery telemetry.
- Multiple GPU adapters are preserved.
- NativeRelay failure or absence falls back to browser-only capability detection and conservative viewer defaults.
- The integration does not change existing GLB loading, screenshot, persistence or rendering behavior.
- No outbound user/model data transmission is introduced.
