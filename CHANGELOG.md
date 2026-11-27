# Changelog

This file records the notable changes in **every published GitHub release tag**. Each entry links to its release, the pull request(s) responsible, and the GitHub compare view. The compare links are the authoritative commit-level history for each release range.

Unreleased work is not listed as a published release. There is no published `v1.0.5` release in the repository's release history; the next published tag after `v1.0.4` is `v1.0.6`.

## [v1.0.14] — 2026-11-28

**Fix: missing ground-shadow receiver**

- Created and added the missing transparent ground-shadow receiving plane before lighting controls and model-positioning code use it.
- Restored the shadow opacity, visibility, and model-light positioning paths that referenced the undefined `groundShadow` variable.
- Added a regression test verifying that the receiver is created, configured to receive shadows, added to the scene, and declared before its use.
- Windows installer version updated to `1.0.14`.

PR: [#41](https://github.com/VeloraTech/GLB-Viewer/pull/41) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.14) · [Compare v1.0.13...v1.0.14](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.13...v1.0.14)

## [v1.0.13] — 2026-11-27

**Fix: remove remote Ionicons from viewer startup**

- Removed the Ionicons CDN dependency from the viewer toolbar.
- Replaced the eight toolbar icon components with local lightweight glyphs and CSS.
- Removed the obsolete icon mutation path that depended on Ionicons elements.
- Added regression coverage to prevent remote Ionicons references from returning.
- Updated the Windows installer version to `1.0.13`.

This makes the toolbar independent of the Ionicons CDN. It does not, by itself, guarantee that every other viewer resource or update operation works offline.

PR: [#40](https://github.com/VeloraTech/GLB-Viewer/pull/40) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.13) · [Compare v1.0.12...v1.0.13](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.12...v1.0.13)

## [v1.0.12] — 2026-11-27

**Fix: viewer startup ordering**

- Fixed a startup-order issue involving `currentModel` being read before its initialization.
- Added launcher dependency checks so missing required local viewer assets are reported before the app attempts to start.
- Updated the Windows installer version to `1.0.12`.

PR: [#39](https://github.com/VeloraTech/GLB-Viewer/pull/39) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.12) · [Compare v1.0.11...v1.0.12](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.11...v1.0.12)

## [v1.0.11] — 2026-11-27

**Fix: desktop favicon request handling**

- Fixed the desktop viewer's favicon request handling to avoid the spurious missing-resource request seen during startup.
- Updated the Windows installer version to `1.0.11`.

PR: [#38](https://github.com/VeloraTech/GLB-Viewer/pull/38) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.11) · [Compare v1.0.10...v1.0.11](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.10...v1.0.11)

## [v1.0.10] — 2026-11-27

**Fix: desktop startup and demo viewer tools**

- Fixed desktop startup behavior.
- Wired up the interactive demo viewer tools.
- Updated the Windows installer version to `1.0.10`.

PR: [#37](https://github.com/VeloraTech/GLB-Viewer/pull/37) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.10) · [Compare v1.0.9...v1.0.10](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.9...v1.0.10)

## [v1.0.9] — 2026-11-27

**Fix: normal launch sample loading**

- Fixed sample-model loading when the viewer is launched normally without a model path.
- Updated the Windows installer version to `1.0.9`.

PR: [#36](https://github.com/VeloraTech/GLB-Viewer/pull/36) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.9) · [Compare v1.0.8...v1.0.9](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.8...v1.0.9)

## [v1.0.8] — 2026-11-27

**Fix: Windows default-browser handoff**

- Fixed the Windows launcher handoff to the system's default browser.
- Updated the Windows installer version to `1.0.8`.

PR: [#35](https://github.com/VeloraTech/GLB-Viewer/pull/35) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.8) · [Compare v1.0.7...v1.0.8](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.7...v1.0.8)

## [v1.0.7] — 2026-11-27

**Fix: installed viewer startup and GLB Open With**

- Fixed startup behavior in the installed viewer.
- Corrected the Windows GLB **Open With** workflow.
- Updated the Windows installer version to `1.0.7`.

PR: [#34](https://github.com/VeloraTech/GLB-Viewer/pull/34) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.7) · [Compare v1.0.6...v1.0.7](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.6...v1.0.7)

## [v1.0.6] — 2026-11-27

**Feature: P1 editor workspace and scene editing**

- Implemented the P1 GLB editor workspace and initial scene-editing capabilities.
- Improved viewport lighting controls and workspace behavior.
- Fixed installed-viewer startup failures while preserving workspace access.
- Included `ring.glb` in installed viewer updates.
- Made installed-viewer updates more resilient to slow connections.
- Added automatic Windows installer publishing after a successful main-branch build.

PRs: [#28](https://github.com/VeloraTech/GLB-Viewer/pull/28), [#29](https://github.com/VeloraTech/GLB-Viewer/pull/29), [#30](https://github.com/VeloraTech/GLB-Viewer/pull/30), [#31](https://github.com/VeloraTech/GLB-Viewer/pull/31), [#32](https://github.com/VeloraTech/GLB-Viewer/pull/32), [#33](https://github.com/VeloraTech/GLB-Viewer/pull/33) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.6) · [Compare v1.0.4...v1.0.6](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.4...v1.0.6)

## [v1.0.4] — 2026-11-27

**Feature: P0 foundations and editor workspace**

- Added the P0 core foundations: scene store, command history, scene commands, resource disposal, performance monitoring, hardware capability providers, and adaptive-quality policy.
- Integrated NativeRelay hardware signals with an independent browser-capability fallback.
- Added regression coverage for the core foundations and resource lifecycle.
- Improved website SEO metadata and preloaded the live demo model.
- Refreshed the FAQ layout.
- Added a collapsible editor workspace and viewport controls.
- Added a Blender-inspired right tool shelf and draggable editor panels.
- Added the startup viewer updater with staged bundle validation and fallback to installed assets.

PRs: [#18](https://github.com/VeloraTech/GLB-Viewer/pull/18), [#19](https://github.com/VeloraTech/GLB-Viewer/pull/19), [#20](https://github.com/VeloraTech/GLB-Viewer/pull/20), [#21](https://github.com/VeloraTech/GLB-Viewer/pull/21), [#22](https://github.com/VeloraTech/GLB-Viewer/pull/22), [#23](https://github.com/VeloraTech/GLB-Viewer/pull/23), [#24](https://github.com/VeloraTech/GLB-Viewer/pull/24), [#25](https://github.com/VeloraTech/GLB-Viewer/pull/25), [#26](https://github.com/VeloraTech/GLB-Viewer/pull/26), [#27](https://github.com/VeloraTech/GLB-Viewer/pull/27) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.4) · [Compare v1.0.3...v1.0.4](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.3...v1.0.4)

## [v1.0.3] — 2026-11-11

**Release: Windows launcher polish and release consistency**

- Polished the Windows launcher and aligned release/version behavior.
- Added README demo media and one-click versioned releases.
- Continued the focused GLB viewing and inspection experience.

PRs: [#16](https://github.com/VeloraTech/GLB-Viewer/pull/16), [#17](https://github.com/VeloraTech/GLB-Viewer/pull/17) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.3) · [Compare v1.0.2...v1.0.3](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.2...v1.0.3)

## [v1.0.2] — 2026-11-11

**Feature: distributable Windows installer**

- Added a distributable Windows installer.
- Established the packaged Windows desktop installation path.

PR: [#15](https://github.com/VeloraTech/GLB-Viewer/pull/15) · [Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.2) · [Compare v1.0.1...v1.0.2](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.1...v1.0.2)

## [v1.0.1] — 2026-11-11

**Documentation and discoverability**

- Rewrote the README with clearer product positioning and getting-started instructions.
- Updated platform support and contribution documentation.
- Refined the roadmap and V2 discovery direction.
- Improved website SEO and social-sharing metadata.
- Added structured data, `robots.txt`, and an XML sitemap.
- No intentional viewer-functionality or launcher-behavior change was part of this documentation release.

[Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.1) · [Compare v1.0.0...v1.0.1](https://github.com/VeloraTech/GLB-Viewer/compare/v1.0.0...v1.0.1)

## [v1.0.0] — Initial stable release

- Established the first stable GLB viewing experience.
- Included the Windows desktop file-opening workflow.
- Included the existing viewer interface and controls.
- This is the baseline before later experimental mobile browser/file-picker work.

[Release](https://github.com/VeloraTech/GLB-Viewer/releases/tag/v1.0.0)

---

## Release and commit traceability

- Every published release above links to its GitHub tag/release page.
- Each release with a pull request links to the PR that introduced the release changes.
- Compare links show the full commit-level diff between published tags.
- Release tags are the published version markers; individual commit SHAs remain visible in the linked GitHub compare and PR pages.
