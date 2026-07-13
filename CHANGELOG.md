# Changelog

All notable changes to Brain are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [0.3.0] — 2026-07-13

### Added
- **Global ⌘K search.** Fuzzy search across every note in the vault from a
  single command palette. Matches note titles and body content, jumps
  straight to the selected note on `Enter`.
- **Quick capture hotkey.** A global system-wide hotkey pops up a small
  always-on-top capture window from anywhere on macOS. Type a thought,
  press `⌘⏎`, and it's appended to your Inbox note without switching
  apps or losing focus of what you were doing.
- **Reorderable sidebar categories.** Drag categories in the sidebar to
  arrange them in whatever order fits your brain. Order is persisted in
  an app-controlled config file (not in folder names or note contents),
  so renaming a folder on disk doesn't disturb the ordering, and the
  vault stays clean and Obsidian-compatible. The pinned Inbox and Trash
  entries stay pinned; only user-created categories move. Dragging a
  note onto a category still moves the note as before — the two
  interactions don't interfere.
- **Always-visible drag affordance.** Each category row shows a subtle
  `⋮⋮` grip at rest so the reorder mechanic is discoverable without
  hovering. The grip brightens on hover and while dragging.
- **GFM tables in Read mode.** Pasting a table from ChatGPT, a webpage,
  or any Markdown source now renders as a proper table in Read mode,
  with per-column alignment preserved. Previously tables only rendered
  correctly in Edit mode and collapsed into a paragraph in Read mode.


## [0.2.0] — 2026-06-28

### Added
- **Edit / Read mode toggle.** Each note now has an `Edit | Read` switch in
  the header (keyboard shortcut `⌘⇧R`). Edit mode shows the raw Markdown
  source for fast typing and editing; Read mode shows the rendered,
  read-only view for distraction-free reading and sharing.
- **Native spellcheck with right-click suggestions.** Misspelled words are
  underlined in red, and right-clicking one opens a native context menu
  with suggested corrections (powered by Electron's built-in
  spellchecker), plus "Add to Dictionary" and the standard
  Cut / Copy / Paste / Paste and Match Style / Select All actions. Link
  context also exposes Copy Link and Open Link in Browser.
- **Rich paste → Markdown.** Pasting formatted content into a note (e.g. an
  answer from ChatGPT/Copilot in a browser, a webpage selection, a Google
  Docs snippet) now converts the HTML on the clipboard to Markdown source
  before insertion. Headings, bold/italic, inline `code`, fenced code
  blocks (with language hint when available), ordered/unordered/nested
  lists, GFM task lists, links, images, blockquotes, horizontal rules,
  tables, and strikethrough are all preserved. When the clipboard only
  contains plain text (e.g. pasting raw Markdown source from another
  editor), the text is inserted verbatim.


## [0.1.0] — 2026-06

Initial public release.

### Added
- Local-first markdown vault: every `.md` file in the chosen folder is a note; subfolders are categories.
- Wikilinks (`[[Note Title]]`) with backlinks panel ("Linked mentions").
- Interactive `- [ ]` / `- [x]` checkboxes that sync back to the file.
- YAML frontmatter (title, tags, created, modified).
- Two-way sync with disk — external edits show up in Brain, Brain edits show up on disk.
- Obsidian-compatible vault layout.
- macOS Apple Silicon build (`Brain-darwin-arm64.zip`).
