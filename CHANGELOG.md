# Changelog

All notable changes to Brain are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [0.4.0] — 2026-07-29

### Added
- **Calendar view.** A new `Calendar` entry in the sidebar opens a
  month-grid view of note activity. Each day cell lists the notes whose
  date falls on that day, today's cell is highlighted, and the week
  starts on Monday. A toggle switches between three modes: `Created`,
  `Modified`, and `Scheduled`. Day cells clip after three entries and
  reveal the rest through a `+N more` popover, so a busy day never
  breaks the grid.
- **Scheduled notes.** Notes can now be assigned to a specific day via
  an optional `scheduled: YYYY-MM-DD` field in their YAML frontmatter.
  A small `Schedule` button appears next to the tag chips on every
  note — click it to pick a date, or clear it to unschedule. Scheduled
  notes show up on that day in the calendar's Scheduled mode, and can
  be **dragged from one day cell to another** to reschedule; the file's
  frontmatter is rewritten in place.
- **Nested categories (up to 3 levels).** Categories can now contain
  subcategories. Expand any category in the sidebar with its chevron,
  or hover it and click `+` to add a child. Each subcategory is a real
  folder on disk (e.g. `Work/Projects/Q3`), so the vault stays fully
  Obsidian- and Finder-compatible. When a category has children, an
  `Include subcategories` toggle appears in its note list so you can
  view just that folder or every note beneath it.
- **Move notes between categories.** Drag any note from the list onto a
  category in the sidebar to move it, or right-click a note and pick
  `Move to…` to choose a destination from the full nested tree. The
  underlying `.md` file is moved on disk; wikilinks, backlinks, and
  scheduled dates are preserved.
- **Persistent Edit / Read mode.** The `Edit | Read` choice now sticks
  across notes and categories. Switch to Read once and every note you
  open stays in Read until you switch back. The preference persists
  across app launches.

### Changed
- **Schedule chip is now a real button.** The scheduling control's
  entire surface is clickable and opens a compact date popover, instead
  of relying on a hidden native picker that was only clickable near the
  right edge.
- **Restoring from Trash returns to the exact original location.** Notes
  moved to Trash now record their original nested category in
  frontmatter (`originalCategory`), so `Restore` puts them back exactly
  where they came from — including deep subfolders.

### Fixed
- **GFM tables render in Read mode.** Tables written in GitHub-Flavored
  Markdown (including per-column alignment `:---`, `:--:`, `---:`) now
  render as proper HTML tables in Read mode. Previously they collapsed
  into a single paragraph. Especially useful when pasting tables from
  ChatGPT or other Markdown sources.
- **Calendar mode toggle no longer misleads.** In `Scheduled` mode, the
  `Created / Modified` sub-toggle is disabled — it did nothing there and
  now says so.


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
