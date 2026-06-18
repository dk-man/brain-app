# Changelog

All notable changes to Brain are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
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
