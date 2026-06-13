
# Hello World — Standalone Mac App

Start small: wrap a minimal React page in Electron and produce a downloadable macOS app. Once this works end-to-end, we add features.

## What you'll get

- A `.zip` containing `HelloWorld-darwin-x64.app` you can download and double-click on your Mac.
- The same app also runs in the Lovable web preview (it's still a normal web app under the hood).

## Steps

1. **Replace the placeholder home page** (`src/routes/index.tsx`) with a simple centered "Hello, World 👋" screen using existing Tailwind tokens.
2. **Configure Vite for Electron**: set `base: './'` in `vite.config.ts` so the built `index.html` loads correctly from `file://`.
3. **Add Electron main process** at `electron/main.cjs`:
   - Creates a `BrowserWindow` (1024×768, titled "Hello World").
   - Loads `dist/index.html`.
   - `contextIsolation: true`, `nodeIntegration: false`.
4. **Wire `package.json`**: add `"main": "electron/main.cjs"`.
5. **Install build deps**: `electron` and `@electron/packager` as devDependencies.
6. **Build & package** for macOS (x64) using `@electron/packager`, then zip the `.app` bundle into `/mnt/documents/HelloWorld-darwin-x64.zip` for download.

## Technical notes

- Uses `@electron/packager` (not electron-builder) — works in this sandbox.
- `.cjs` extension is required because the project is ESM (`"type": "module"`).
- Default build target: **macOS Intel (x64)**. Apple Silicon Macs run x64 apps via Rosetta. If you specifically want a native Apple Silicon (arm64) build instead — or both — say so and I'll adjust.
- `.dmg` installers require macOS-only tooling and aren't possible here; you'll get a `.zip` with the `.app` inside, which is the standard distribution form.
- The app will be **unsigned**, so the first launch on macOS requires right-click → Open (or System Settings → Privacy & Security → "Open Anyway"). Code signing requires an Apple Developer certificate.

## After this works

Good next steps once Hello World launches: custom app icon, window menu, persistent local storage, auto-update, or wiring real features from the web app into the desktop shell. We'll tackle those one at a time.
