# Brain

A local-first markdown notes app for macOS. Your notes live as plain `.md` files on your disk — not in a cloud, not in a database, not behind a login. Open them in Brain, in Obsidian, in VS Code, in `cat`. They're yours.

**Website:** [alexlabs.dev](https://alexlabs.dev)
**Download:** [Latest release](https://github.com/dk-man/brain-app/releases/latest)

---

## Features

- **Local-first** — notes are plain markdown files in a folder you pick. No account, no sync server, no telemetry.
- **Wikilinks & backlinks** — write `[[Note Title]]` to link between notes. Each note shows a "Linked mentions" section listing every other note that points to it.
- **Interactive checkboxes** — `- [ ]` and `- [x]` render as real checkboxes you can click; the markdown file updates in place.
- **YAML frontmatter** — optional `---` block at the top of a note for tags, categories, and custom metadata.
- **Two-way sync with disk** — edit a file in any other editor and Brain picks up the change. Edit it in Brain and the file on disk updates.
- **Rich paste → Markdown** — paste formatted text from a browser, Copilot/ChatGPT, or a webpage and Brain converts the HTML to Markdown (headings, lists, code blocks, links, tables, …). Plain-text Markdown pastes verbatim.
- **Obsidian-compatible** — the same vault works in both apps.

## Install (macOS)

1. Download `Brain-darwin-arm64.zip` from the [latest release](https://github.com/dk-man/brain-app/releases/latest).
2. Unzip and drag `Brain.app` to `/Applications`.
3. The app is not code-signed yet, so the first launch needs a right-click → **Open** → **Open** to bypass Gatekeeper. After that it opens normally.

Apple Silicon (M1/M2/M3/M4) only for now. Intel and Windows builds may follow.

## How it works

Brain is an [Electron](https://www.electronjs.org/) shell around a React + TanStack Start frontend. On first launch it asks for a folder — your "vault". Every `.md` file in that folder becomes a note. Subfolders become categories.

There is no database. There is no server. Closing the app and deleting it leaves your notes exactly where they were.

## Build from source

```bash
git clone https://github.com/dk-man/brain-app.git
cd brain-app
bun install
bun run build
npx electron .
```

To package a distributable `.app`:

```bash
npx @electron/packager . "Brain" \
  --platform=darwin --arch=arm64 \
  --out=electron-release --overwrite
```

## Versioning

Releases follow [semantic versioning](https://semver.org/): `MAJOR.MINOR.PATCH`. Each tagged release on GitHub includes the packaged `.zip` so non-developers can download a working app without touching a terminal.

## License

MIT. See [LICENSE](LICENSE).
