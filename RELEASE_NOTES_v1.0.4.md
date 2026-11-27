# GLB Viewer v1.0.4 — Historical Release Notes

> **Release status:** Published as [v1.0.4](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.4). This document records the actual historical release contents; it is not a pending release checklist.

## Highlights

### Editor workspace
- Added a collapsible editor workspace and viewport controls.
- Added a Blender-inspired right-side tool shelf.
- Added draggable, resizable editor panels and workspace foundations.
- Added the initial editor state store, tool registry, workspace manager, viewport interaction, and scene runtime boundaries.

### P0 core foundations
- Added SceneStore, CommandHistory, SceneCommands, and ResourceDisposer.
- Added local performance monitoring and bounded diagnostics.
- Added hardware capability providers and an adaptive-quality policy.
- Integrated optional NativeRelay hardware signals with an independent browser fallback.

### Windows viewer updates
- Added a startup viewer updater that downloads a coherent bundle from one immutable commit.
- Stages and validates the bundle before activating it in the current Windows user's LocalAppData directory.
- Falls back to the installed viewer when an update check or download fails.
- Model files are not included in the update bundle.

### Website
- Improved SEO metadata and social sharing metadata.
- Preloaded the live demo model.
- Refreshed the FAQ layout.

## Historical limitations and later changes

At the time of v1.0.4, the toolbar used Ionicons from a remote CDN. That dependency was later removed in [v1.0.13](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.13), where toolbar icons became local CSS/text glyphs.

The startup updater uses HTTPS and content sanity checks; it is not a cryptographically signed update system. The updater and browser-based runtime should not be described as a fully native/offline application.

The v1.0.4 workspace was an early editor foundation. It did not represent completion of the wider V2 roadmap. See [ROADMAP.md](ROADMAP.md) for current status.

## Release trace

- PRs: [#18–#27](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.3...v1.0.4)
- Tag/release: [v1.0.4](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.4)
- Full commit comparison: [v1.0.3...v1.0.4](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.3...v1.0.4)
