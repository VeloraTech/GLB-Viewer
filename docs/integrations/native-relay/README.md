# NativeRelay hardware integration

## Purpose and scope
GLB Viewer can optionally read a local hardware profile from [NativeRelay](https://github.com/VeloraTech/NativeRelay). The integration informs an adaptive-quality recommendation; it does **not** change renderer settings, model data, or scene contents automatically. NativeRelay is optional. Browser WebGL detection and measured frame times remain independent fallback signals.

## Data flow
1. The Windows launcher starts an HTTP server bound only to `127.0.0.1`.
2. The viewer requests `GET /__hardware/profile` from that same local origin.
3. The launcher invokes `nativerelay hardware --json` as a child process and returns profile JSON.
4. The browser provider independently reads WebGL limits and context attributes.
5. `AdaptiveQualityPolicy` combines available signals into a `balanced` or `conservative` recommendation with reason codes.

The launcher bounds NativeRelay execution to four seconds and stdout to one MiB. The browser request has a separate short timeout. The launcher starts the executable directly, without shell interpolation.

## Install and configure
Install NativeRelay using its [official project instructions](https://github.com/VeloraTech/NativeRelay) and make its executable available on the launcher's `PATH`. The default executable name is `nativerelay`.

If it is not on `PATH`, set `NATIVERELAY_EXE` to the full executable path in the environment inherited by GLB Viewer. For example, in PowerShell before launching:

```powershell
$env:NATIVERELAY_EXE = 'C:\Tools\NativeRelay\nativerelay.exe'
```

NativeRelay is not required for ordinary viewing.

## Contract and behavior
The endpoint accepts the versioned `glb-viewer.hardware-profile` contract. It requests NativeRelay's static hardware profile; it does not start the separate streaming/watch mode. Unavailable measurements remain unavailable (for example, `null`), never fabricated as zero.

The policy considers low available system memory, low battery while on battery power, slow measured frame times, and limited WebGL texture capacity. Missing memory or battery readings are neutral. Browser WebGL detection is guarded against context loss and individual parameter-query failures. NativeRelay failure does not disable browser/frame-time signals; browser failure does not disable a valid NativeRelay profile. If all sources are unavailable, the recommendation defaults to conservative.

## Local security and privacy
- The launcher binds to IPv4 loopback (`127.0.0.1`), not a LAN interface.
- The hardware endpoint requires the exact loopback Host and same-origin Origin for the active port.
- The endpoint does not enable CORS and responses use `Cache-Control: no-store`.
- NativeRelay runs as a child process without shell interpolation; stdin and stderr are not exposed to the viewer.
- Hardware data is read locally. This integration does not upload hardware data, model files, project files, or source code to a remote service.
- The endpoint exists only during the desktop launcher's local session. Browser-only hosting does not provide NativeRelay hardware access.

## Platform support and limitations
NativeRelay integration currently belongs to the Windows launcher workflow. Other browser environments use browser-detectable WebGL capabilities and measured frame times, without OS-level memory or battery information from this endpoint.

This phase is recommendation-only. Automatic renderer-quality changes, continuous hardware polling, and NativeRelay's dynamic resource-watch stream are out of scope.
