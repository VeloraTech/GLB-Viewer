# Contributing to GLB Viewer

Thanks for helping make GLB Viewer a focused, lightweight way to open and inspect 3D models.

Contributions are welcome: bug reports, platform testing, accessibility fixes, documentation, and carefully scoped code changes.

## Before you start

1. Browse the [open issues](https://github.com/VeloraTech/GLB-Viewer/issues).
2. For a substantial change, open an issue first so the goal and trade-offs are clear.
3. Keep the product focused. GLB Viewer is not intended to become a full Blender replacement.
4. Avoid adding frameworks, build systems, or large dependencies without a clear need.

## Local setup

```bash
git clone https://github.com/VeloraTech/GLB-Viewer.git
cd GLB-Viewer
```

There is no npm install or frontend build step for the current vanilla HTML/CSS/JavaScript application.

- To inspect the standalone viewer, open `viewer.html` in a supported modern browser.
- To test the Windows file-opening workflow, follow [PLATFORM_SUPPORT.md](PLATFORM_SUPPORT.md) and use the provided launcher scripts.
- To work on the website, serve the `docs/` directory locally so browser module imports and file selection behave as expected.

## Making a contribution

1. Create a focused branch.
2. Make the smallest change that solves the issue.
3. Test the affected workflow on the relevant platform and browser.
4. Check the browser console for errors and verify responsive layouts when changing the website.
5. Open a pull request describing the problem, implementation, testing performed, and any limitations.

Do not claim a platform or browser was tested unless it was actually tested.

## Reporting a bug

Include:
- Operating system and version
- Browser and version (if applicable)
- Which experience you used: desktop launcher, standalone `viewer.html`, or website demo
- Exact steps to reproduce
- Expected result and actual result
- Console output or screenshots when useful

Do not attach private 3D files unless they are safe to share publicly.

## Areas where help is useful

- Test the viewer across Windows, macOS, and Linux browsers.
- Help investigate native macOS and Linux file-opening workflows.
- Improve accessibility, keyboard interaction, and mobile website behavior.
- Research common quick-editing workflows to inform V2.
- Create and maintain the product demo recording.

## Product direction

V2 is in a discovery phase. Suggestions should explain the real task they solve and how often that task occurs. A feature being available in Blender does not automatically make it right for GLB Viewer.

Please keep the experience fast to understand, light to run, and centered on the model.

## License

By contributing, you agree that your contributions will be made available under the project's MIT License.
