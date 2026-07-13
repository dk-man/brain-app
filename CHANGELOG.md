# Changelog

All notable changes to Brain are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [0.3.0] — 2026-07-13

### Added
- **Global ⌘K search.** Open a single command palette from anywhere in the
  app with `⌘K` and search across every note in the vault. Fuzzy matching
  covers both note titles and body content, so you can find a note even
  when you only remember a word from its contents. Select any result and
  press `Enter` to jump straight to that note.
- **Quick capture hotkey.** Capture a thought instantly without breaking
  focus. Press the global `⌘⇧C` hotkey from any app on macOS to open a
  small, always-on-top capture window. Type the note, press `⌘⏎`, and the
  text is appended to a dedicated `Inbox` note inside your vault. The
  window closes automatically and you return to whatever you were doing.
  No need to switch to Brain first, no need to pick a category, no need
  to create a file manually. This is designed for transient ideas — a
  link, a sentence, a task — that you want to save now and organize later.
  The `Inbox` note is created automatically if it doesn't exist.
- **Reorderable sidebar categories.** Arrange categories in the sidebar in
  the order that matches how you think. Drag any user-created category up
  or down and the new order is saved immediately to an app-controlled
  config file, so it survives across launches. The order is independent of
  the underlying folder names on disk, which means renaming or moving a
  folder on disk won't scramble your layout, and the vault remains fully
  Obsidian-compatible. The `Inbox` and `Trash` entries remain pinned at
  the top and bottom; only the user-created categories between them are
  movable. The existing drag-a-note-onto-a-category behavior still works
  exactly as before — the two drag interactions are handled separately.
- **Always-visible drag affordance.** The category rows now show a subtle
  `⋮⋮` grip at all times so the reorder mechanic is discoverable without
  hovering. At rest the grip is low-opacity and quiet; it brightens on
  hover and while dragging so the row still reads as a navigation item
  first and a draggable handle second. The grip's space is reserved at
  rest, so the layout doesn't shift when hover state changes.
- **GFM tables in Read mode.** Tables written in GitHub-Flavored Markdown
  now render correctly in Read mode, including per-column alignment
  (`:---`, `:--:`, `---:`). Pasting a table from ChatGPT, a browser, or
  another Markdown source will now display as a proper table instead of
  collapsing into a single paragraph. Tables already rendered correctly
  in Edit mode; this change brings Read mode to parity.


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
