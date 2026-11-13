# NativeRelay Hardware Contract — Implementation Prompt

> **Copy this entire document into the coding agent working in `VeloraTech/NativeRelay`.**
>
> Target repository: `VeloraTech/NativeRelay`  
> Target branch: `glb-nativerelay-contract` (already created from `main`)  
> Consumer: `VeloraTech/GLB-Viewer`  
> Purpose of this branch: implement and validate the NativeRelay hardware-information contract that GLB Viewer will consume. Do not merge this branch.

---

## 1. Mission

Build a GLB Viewer-specific, cross-platform hardware-information collection capability in NativeRelay.

GLB Viewer needs reliable host-computer information to make its own decisions about rendering quality, model-loading strategy, resource-heavy operations, battery-aware behavior and graceful degradation.

NativeRelay is responsible for **collecting and normalizing facts about the host system**. GLB Viewer is responsible for **evaluating its browser/runtime capabilities, measuring its own rendering performance and deciding how to adapt**.

This is not a generic system-monitoring dashboard and not a replacement for NativeRelay's existing process/file observability product. It is a separate, well-defined hardware-profile capability that fits the existing NativeRelay architecture.

Do not implement Three.js, WebGL detection, FPS measurement, scene-complexity analysis or GLB Viewer feature policies in NativeRelay.

## 2. Repository facts already established

The current NativeRelay repository is a Python 3.11+ project with no runtime dependencies declared in `pyproject.toml`.

Its existing architecture separates:
- Platform-neutral contracts and models under `nativerelay/`.
- Linux-specific collection under `collectors/linux/`.
- Windows-specific collection under `collectors/windows/`.
- Documentation under `docs/`.
- Tests under `tests/`.

The existing event model, bounded event stream and process/filesystem collectors must remain backward-compatible.

The README currently documents Linux and Windows collectors. macOS collector work is described as future work. Do not claim macOS hardware support until it is implemented and tested.

Use the existing standard-library-first philosophy. Add a dependency only when there is a concrete technical reason, document it, and consider the installation/data-size implications.

## 3. Branch and change boundaries

Work only on `glb-nativerelay-contract`.

Before coding:
1. Inspect the complete repository and current branch.
2. Read `pyproject.toml`, the core models, collector interface, CLI, platform collectors, tests and architecture/privacy documentation.
3. Identify existing conventions and avoid duplicating functionality.
4. Design the hardware capability as a separate contract from the existing process/file event contract.
5. Keep changes focused on this GLB Viewer integration.

Do not change the existing event schema or break current CLI behavior. Do not merge or publish a release.

## 4. Contract identity and versioning

Create a versioned contract with this identity:

- Contract ID: `glb-viewer.hardware-profile`
- Initial contract version: `1.0.0`
- Provider name: `NativeRelay`

The contract must be transport-independent. Do not hard-code assumptions about HTTP, IPC, sockets, subprocess pipes or a particular launcher. First implement a stable Python API and deterministic JSON serialization. A separate adapter/transport can expose it to the browser-based GLB Viewer later.

Use explicit schema versioning and document compatibility rules. Never silently change a field's meaning or unit.

## 5. Required logical operations

Provide a clear, documented API for:

### `get_hardware_profile()`
Returns relatively static or slow-changing host hardware and system information.

### `get_resource_snapshot()`
Returns a point-in-time snapshot of dynamic resource/power/thermal information.

### `get_provider_info()`
Returns NativeRelay version, supported contract versions, platform identity and supported collection capabilities.

These should be usable through a stable public NativeRelay API. Also provide a machine-readable JSON representation for integration testing. Do not make dynamic sensor polling an automatic side effect of every profile request.

The exact names may follow established repository naming conventions, but the responsibilities and separation must remain.

## 6. Complete field inventory

Implement the full contract shape now, including fields that may be unsupported on some hardware or operating systems. Do not omit a field merely because it is optional. Optional means the value may be unavailable; it does not mean the contract should forget the field.

### 6.1 Collection metadata

Include:
- Contract ID and version.
- Provider name and NativeRelay version.
- UTC ISO-8601 collection timestamp.
- Collection duration in milliseconds.
- Overall collection status: `complete`, `partial`, or `failed`.
- Warnings.
- Unsupported capabilities.
- Failed fields.
- Field-level availability/provenance metadata where useful.
- Whether values are directly observed, OS-reported, derived or estimated.

### 6.2 Operating system and machine

Include:
- OS name: `windows`, `linux`, `macos`, or `unknown`.
- OS version and build.
- Kernel version.
- OS/process architecture.
- Hardware architecture.
- System uptime in seconds.
- Form factor: `desktop`, `laptop`, `tablet`, `workstation`, `server`, `unknown`.
- Virtualization status where reliably detectable.

Do not collect hostnames, usernames, machine serials, MAC addresses, product keys or account identifiers.

### 6.3 CPU

Include:
- Vendor.
- Brand/model.
- Architecture.
- Family/model/stepping identifiers where available.
- Physical core count.
- Logical processor count.
- Base frequency in MHz.
- Maximum frequency in MHz.
- Current frequency in MHz.
- Overall utilization percentage.
- Per-core utilization percentages.
- CPU temperature in Celsius.
- Thermal-throttling status.
- Supported instruction capabilities, including relevant SSE, AVX, AVX2, AVX-512 and ARM NEON features.

Do not infer unsupported instruction features from a model name. Only report a feature as supported when it was reliably detected.

### 6.4 System memory

Include:
- Total physical RAM in bytes.
- Available RAM in bytes.
- Used RAM in bytes.
- Free RAM in bytes.
- Cached/buffered memory in bytes where the OS exposes a meaningful value.
- Memory utilization percentage.
- Swap/pagefile total, used and available bytes.
- Memory pressure state where supported.

Distinguish free memory from available memory. Document OS-specific calculation semantics.

### 6.5 GPU adapters

Support zero, one or multiple adapters. For each adapter include:
- Name.
- Vendor.
- Vendor ID.
- Device ID.
- Subsystem ID where available.
- Architecture where available.
- Type: `integrated`, `discrete`, `virtual`, `unknown`.
- Dedicated memory bytes.
- Shared memory bytes.
- Total reported memory bytes.
- Driver name, version and date where available.
- Utilization percentage.
- Temperature in Celsius.
- Power consumption in watts.
- Power limit in watts.
- Core clock MHz.
- Memory clock MHz.
- Active status where detectable.
- Primary display adapter status where detectable.

Do not assume the first adapter is the best adapter. Do not treat integrated graphics shared memory as dedicated VRAM. Do not imply that OS-reported VRAM is the amount available to WebGL.

### 6.6 Battery

Include:
- Battery presence.
- Battery-information support status.
- Battery percentage.
- Charge state: `charging`, `discharging`, `full`, `not_charging`, `unknown`.
- Charging boolean.
- Discharging boolean.
- Fully charged boolean.
- External power connected boolean.
- Power source: `ac`, `battery`, `unknown`.
- Battery health percentage.
- Design capacity in mWh.
- Full-charge capacity in mWh.
- Remaining capacity in mWh.
- Voltage in mV.
- Estimated remaining runtime in seconds.
- Estimated time until fully charged in seconds.
- Battery temperature in Celsius.
- Battery count.

A desktop without a battery is not a 0%-battery machine. Represent absence distinctly from unavailable battery telemetry. Never fabricate a percentage or runtime.

### 6.7 Power management

Include:
- Current power source.
- AC connection state.
- Active power profile: `power_saver`, `balanced`, `performance`, `high_performance`, `unknown`.
- Power-saver state.
- Battery-saver state.
- Performance-mode state.
- Low-power condition.
- CPU power-management state where accessible.
- GPU power-management state where accessible.

Do not modify power plans, CPU governors, GPU settings, fan curves or other host settings. Collection only.

### 6.8 Thermal and cooling information

Include:
- Overall thermal state: `cool`, `normal`, `warm`, `hot`, `critical`, `unknown`.
- CPU temperature.
- GPU temperature.
- Battery temperature.
- Other named sensor temperatures when safely identifiable.
- Thermal throttling state.
- Critical thermal condition.
- Fan count and per-fan RPM where available.

Do not apply universal temperature thresholds across unrelated hardware. If NativeRelay cannot make a reliable normalized classification, preserve available raw measurements and report state as `unknown`.

### 6.9 Storage

For relevant volumes include:
- Volume category.
- Total bytes.
- Available bytes.
- Used bytes.
- Filesystem.
- Device type: `ssd`, `hdd`, `nvme`, `removable`, `network`, `unknown`.
- Read-only status.
- Removable status.
- Network-backed status.

Do not inspect file contents or directory listings. Avoid exposing personal mount paths, volume serials or identifiers unless strictly necessary.

### 6.10 Displays

Include:
- Display count.
- Per-display current width and height in pixels.
- Native width and height where available.
- Refresh rate in Hz.
- Scale factor where available.
- Primary-display status.
- HDR support.
- HDR enabled state.

Do not collect monitor serial numbers. Explain platform limitations.

### 6.11 Dynamic resource snapshot

Include:
- Snapshot timestamp.
- CPU utilization percentage.
- Per-core utilization where available.
- Memory utilization percentage.
- Available memory bytes.
- Swap utilization percentage.
- Per-GPU utilization.
- Thermal state and available temperature measurements.
- Battery percentage.
- Power source.
- Power-saver/battery-saver state.

Keep this operation separate from the static profile. Sensor access can be expensive or unavailable; expose capabilities and avoid continuous polling by default.

## 7. Data semantics and validation

Use consistent units:
- Memory/storage: integer bytes.
- Frequencies: MHz.
- Temperatures: Celsius.
- Power: watts.
- Battery capacities: mWh.
- Voltage: mV.
- Durations: seconds, except collection duration in milliseconds.
- Percentages: numeric values from 0 through 100.
- Timestamps: timezone-aware UTC ISO-8601.

Use `null` for unavailable optional scalar values. Use empty arrays for no detected entries. Never use zero as a substitute for unknown data.

Distinguish:
- `available`
- `unavailable`
- `unsupported`
- `permission_denied`
- `not_applicable`
- `estimated`
- `error`

Do not conflate a device not being present with a sensor being inaccessible.

Document whether each value is measured, OS-reported, derived or estimated. A profile may be partial without being invalid.

## 8. Platform support

Implement platform-specific adapters behind one platform-neutral hardware contract.

- Windows: use supported native OS facilities and APIs. Do not assume WMI or privileged sensor access is always available.
- Linux: use appropriate `/proc`, `/sys`, and OS facilities with permission-aware fallbacks. Do not assume every distribution exposes the same sensors.
- macOS: inspect available native facilities and implement only what can be supported reliably. Do not claim coverage that has not been implemented and tested.

For every field, produce a support matrix for Windows, Linux and macOS with states such as implemented, partial, permission-dependent, unsupported or untested.

Keep platform-specific imports out of the platform-neutral contract layer. Do not add a platform collector that crashes imports on other operating systems.

## 9. Privacy and security requirements

- All collection is local.
- No hardware profile or resource snapshot may be sent to an external service.
- Do not collect personal files, usernames, serial numbers, MAC addresses, product keys or unrelated identifiers.
- Do not execute arbitrary shell commands assembled from user-controlled input.
- Do not require administrator/root privileges for ordinary fields when a safe unprivileged API exists.
- Report permission requirements and degraded coverage honestly.
- Do not change host settings.
- Document any OS APIs or commands used and their privacy implications.

## 10. GLB Viewer responsibility boundary

NativeRelay provides facts; GLB Viewer decides how to use them.

Potential consumer uses:
- CPU cores/utilization → control CPU-heavy concurrency.
- Available RAM/memory pressure → adapt model loading and processing.
- GPU adapters/memory → inform initial quality selection.
- Battery percentage/power source → reduce optional resource-intensive work.
- Battery saver → choose conservative defaults.
- Thermal state → reduce workloads during thermal pressure.
- Storage availability → avoid excessive temporary data.
- Display characteristics → inform initial viewport settings.

GLB Viewer must independently detect browser/runtime information:
- WebGL availability/version.
- WebGL extensions and limits.
- Maximum texture size and other graphics limits.
- Browser device-pixel ratio.
- Actual frame time and FPS.
- Scene complexity.
- Actual model loading and rendering performance.

NativeRelay must not report these browser-only facts or claim that host hardware specifications guarantee rendering performance.

## 11. Deliverables

Follow existing repository layout and conventions. Deliver:

1. Public, documented hardware-profile data models.
2. Public collection operations for profile, resource snapshot and provider info.
3. Platform-specific collectors/adapters.
4. Machine-readable JSON Schema for the contract.
5. Deterministic example fixtures, including:
   - A typical desktop.
   - A laptop with battery and AC connected.
   - A laptop on battery saver.
   - A machine without a battery.
   - An integrated-GPU-only machine.
   - A multi-GPU machine.
   - A machine with unavailable sensor permissions.
   - A partial/unsupported platform response.
6. Field-support matrix for Windows, Linux and macOS.
7. Contract and API documentation.
8. Tests for model validation, serialization, units, nullability, enum values, platform fallback behavior and partial collection.
9. A short GLB Viewer integration note explaining how the contract can be consumed without coupling the viewer to NativeRelay internals.

Use the repository's existing test and documentation conventions. Do not create empty placeholder modules.

## 12. Performance requirements

- Static profile collection should be reasonably cheap and should not repeatedly scan the machine.
- Dynamic resource collection must be a separate request.
- No default continuous sensor polling.
- Do not block the existing event stream or alter its behavior.
- Avoid unnecessary subprocesses and heavyweight dependencies.
- Make expensive sensor collection optional or separately requestable.
- Document approximate collection cost and known expensive operations.

## 13. Test and verification requirements

Run the existing test suite and new tests. Validate:
- Existing NativeRelay event APIs remain backward-compatible.
- Existing Linux and Windows collector tests still pass.
- Contract JSON validates against its JSON Schema.
- All examples validate.
- Unknown values remain null and are not coerced to zero.
- No-battery differs from unknown battery state.
- Multiple GPU adapters serialize correctly.
- Percentage and unit bounds are enforced.
- Partial collection does not crash the entire profile.
- Unsupported fields are accurately reported.
- Importing the core contract does not import platform-only modules.

Use deterministic fixtures for automated tests. Clearly separate tests actually run from tests that require physical hardware or privileged CI.

## 14. Final report

When finished, report:
1. Branch name.
2. Files created/modified.
3. Public API names and example usage.
4. Contract schema location and version.
5. Implemented fields.
6. Windows/Linux/macOS support matrix.
7. Fields that remain partial, unsupported or untested.
8. Dependencies added and why.
9. Tests actually executed and their results.
10. Privacy/performance considerations.
11. Known limitations and recommended next integration step.

Do not claim that a field is implemented merely because it exists in the schema. Do not claim macOS support without implementation and verification.

**Success condition:** NativeRelay exposes a stable, versioned, local-only, transport-independent hardware-information API that GLB Viewer can consume consistently, while the existing NativeRelay observability features remain intact.
