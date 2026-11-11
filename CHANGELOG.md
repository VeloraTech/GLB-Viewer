# Changelog

Notable user-facing changes are recorded here. Versions refer to published GitHub releases.

## [1.0.2] - 2026-11-11

### Windows
- Added a standalone launch path so the Start menu shortcut and post-install launch open the viewer without requiring a model argument.
- Kept the Windows **Open With** workflow for opening a selected GLB file.
- Added a viewer heartbeat and an idle-session timeout so the loopback server shuts down after the viewer tab stops communicating.
- Kept the local model-serving endpoint bound to the loopback interface.

### Website and documentation
- Aligned installer filenames and version references with the published v1.0.2 release.
- Updated the website Windows download action to use the latest GitHub Release installer asset.
- Clarified the difference between Windows desktop integration and browser viewing on other platforms.
- Kept the product focused on lightweight GLB viewing and inspection; V2 ideas remain research candidates, not release promises.
