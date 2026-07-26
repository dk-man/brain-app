const { app, BrowserWindow, ipcMain, shell, dialog, nativeTheme, Menu, MenuItem, clipboard, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const fssync = require("fs");

const TRASH = "Trash";
const TRASH_SEP = "__";
const CATEGORIES_FILE = ".categories.json";
const INBOX = "Inbox";

// Quick-capture global hotkey. Change here to rebind.
const QUICK_CAPTURE_HOTKEY = "CommandOrControl+Shift+N";

const DEFAULT_CATEGORIES = [
  { id: "Work", name: "Work", color: "#0071e3" },
  { id: "Hobbies", name: "Hobbies", color: "#34c759" },
  { id: "Shopping", name: "Shopping", color: "#ff9500" },
];

function rootDir() {
  return path.join(app.getPath("documents"), "Brain");
}

function safeJoin(relPath) {
  const root = path.resolve(rootDir());
  const full = path.resolve(path.join(root, String(relPath || "")));
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Path traversal detected");
  }
  return full;
}


function categoriesFilePath() {
  return path.join(rootDir(), CATEGORIES_FILE);
}

function sanitize(name) {
  return String(name || "Untitled")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "Untitled";
}

function sanitizeCategoryId(name) {
  return String(name || "")
    .replace(/[\\/:*?"<>|.]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

async function listCategoryDirsOnDisk() {
  try {
    const entries = await fs.readdir(rootDir(), { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name !== TRASH && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

async function loadCategories() {
  await fs.mkdir(rootDir(), { recursive: true });
  let stored = null;
  try {
    const raw = await fs.readFile(categoriesFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      stored = parsed
        .filter((c) => c && c.id && c.id !== TRASH)
        .map((c) => ({ id: c.id, name: c.name || c.id, color: c.color || "#8e8e93" }));
    }
  } catch {}
  if (!stored) {
    await saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES.slice();
  }
  // Reconcile stored order with what's on disk: drop missing folders,
  // append externally-created folders alphabetically at the end.
  const diskDirs = await listCategoryDirsOnDisk();
  const diskSet = new Set(diskDirs);
  const kept = stored.filter((c) => diskSet.has(c.id));
  const knownIds = new Set(kept.map((c) => c.id));
  const extras = diskDirs
    .filter((d) => !knownIds.has(d))
    .sort((a, b) => a.localeCompare(b))
    .map((d) => ({ id: d, name: d, color: "#8e8e93" }));
  const final = [...kept, ...extras];
  const changed =
    final.length !== stored.length ||
    final.some((c, i) => !stored[i] || stored[i].id !== c.id);
  if (changed && final.length) await saveCategories(final);
  return final.length ? final : stored;
}

async function reorderCategories(orderedIds) {
  const cats = await loadCategories();
  const byId = new Map(cats.map((c) => [c.id, c]));
  const seen = new Set();
  const ordered = [];
  for (const id of Array.isArray(orderedIds) ? orderedIds : []) {
    if (byId.has(id) && !seen.has(id)) {
      ordered.push(byId.get(id));
      seen.add(id);
    }
  }
  for (const c of cats) {
    if (!seen.has(c.id)) ordered.push(c);
  }
  await saveCategories(ordered);
  return ordered;
}

async function saveCategories(cats) {
  await fs.mkdir(rootDir(), { recursive: true });
  await fs.writeFile(categoriesFilePath(), JSON.stringify(cats, null, 2), "utf8");
}

async function ensureDirs() {
  const root = rootDir();
  await fs.mkdir(root, { recursive: true });
  const cats = await loadCategories();
  for (const c of cats) {
    await fs.mkdir(path.join(root, c.id), { recursive: true });
  }
  await fs.mkdir(path.join(root, TRASH), { recursive: true });
  return cats;
}

async function addCategory({ name, color }) {
  const cats = await loadCategories();
  const baseId = sanitizeCategoryId(name);
  if (!baseId) throw new Error("Invalid category name");
  if (baseId === TRASH) throw new Error("Reserved name");
  let id = baseId;
  let i = 2;
  while (cats.find((c) => c.id.toLowerCase() === id.toLowerCase())) {
    id = `${baseId} ${i++}`;
  }
  const cat = { id, name: id, color: color || "#8e8e93" };
  cats.push(cat);
  await saveCategories(cats);
  await fs.mkdir(path.join(rootDir(), id), { recursive: true });
  return cat;
}

async function uniquePath(dir, base, ext) {
  let candidate = path.join(dir, base + ext);
  let i = 2;
  while (fssync.existsSync(candidate)) {
    candidate = path.join(dir, `${base} ${i}${ext}`);
    i++;
  }
  return candidate;
}

function parseTrashName(filename, categoryIds) {
  const base = filename.replace(/\.md$/, "");
  const idx = base.indexOf(TRASH_SEP);
  if (idx > 0) {
    const cat = base.slice(0, idx);
    if (categoryIds.includes(cat)) {
      return { originalCategory: cat, title: base.slice(idx + TRASH_SEP.length) };
    }
  }
  return { originalCategory: categoryIds[0] || "Work", title: base };
}

// ----- Frontmatter -----
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseFrontmatter(raw) {
  const m = raw.match(FM_RE);
  if (!m) return { fm: null, body: raw };
  const fm = {};
  const lines = m[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colon = line.indexOf(":");
    if (colon < 0) { i++; continue; }
    const key = line.slice(0, colon).trim();
    let val = line.slice(colon + 1).trim();
    if (key === "tags") {
      if (val.startsWith("[") && val.endsWith("]")) {
        fm.tags = val.slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
        i++;
      } else if (val === "" || val === "[]") {
        // possible block list
        const arr = [];
        let j = i + 1;
        while (j < lines.length && /^\s*-\s+/.test(lines[j])) {
          arr.push(lines[j].replace(/^\s*-\s+/, "").trim().replace(/^["']|["']$/g, ""));
          j++;
        }
        fm.tags = arr;
        i = j;
      } else {
        fm.tags = [];
        i++;
      }
    } else {
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      fm[key] = val;
      i++;
    }
  }
  return { fm, body: raw.slice(m[0].length) };
}

function yamlEsc(s) {
  const str = String(s ?? "");
  if (str === "") return '""';
  if (/[:#\[\]{}&*!|>'"%@`,\n]/.test(str) || /^\s|\s$/.test(str)) return JSON.stringify(str);
  return str;
}

const SCHED_RE = /^\d{4}-\d{2}-\d{2}$/;
function normScheduled(v) {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  return SCHED_RE.test(s) ? s : null;
}

function serializeFrontmatter(fm) {
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  const lines = [
    `title: ${yamlEsc(fm.title || "")}`,
    `tags: [${tags.map(yamlEsc).join(", ")}]`,
    `created: ${fm.created}`,
    `modified: ${fm.modified}`,
  ];
  const sched = normScheduled(fm.scheduled);
  if (sched) lines.push(`scheduled: ${sched}`);
  // preserve any other unknown keys so external edits aren't lost
  const known = new Set(["title", "tags", "created", "modified", "scheduled"]);
  for (const k of Object.keys(fm)) {
    if (known.has(k)) continue;
    const v = fm[k];
    if (v == null) continue;
    if (Array.isArray(v)) continue;
    lines.push(`${k}: ${yamlEsc(v)}`);
  }
  return `---\n${lines.join("\n")}\n---\n\n`;
}

// ----- self-write tracking so the watcher ignores our own writes -----
const selfWrites = new Map();
function markSelfWrite(full) { selfWrites.set(path.normalize(full), Date.now()); }
function isSelfWrite(full) {
  const key = path.normalize(full);
  const t = selfWrites.get(key);
  if (!t) return false;
  if (Date.now() - t < 1500) return true;
  selfWrites.delete(key);
  return false;
}

async function writeFileTracked(full, data) {
  markSelfWrite(full);
  await fs.writeFile(full, data, "utf8");
}
async function renameTracked(oldFull, newFull) {
  markSelfWrite(oldFull);
  markSelfWrite(newFull);
  await fs.rename(oldFull, newFull);
}

async function readNoteRaw(relPath) {
  const full = safeJoin(relPath);
  return await fs.readFile(full, "utf8");
}

async function ensureFrontmatter(relPath) {
  const full = safeJoin(relPath);
  const raw = await fs.readFile(full, "utf8");
  const parsed = parseFrontmatter(raw);
  if (parsed.fm && parsed.fm.created && parsed.fm.modified) {
    // ensure tags array exists
    if (!Array.isArray(parsed.fm.tags)) parsed.fm.tags = [];
    if (!parsed.fm.title) parsed.fm.title = path.basename(relPath, ".md");
    return { frontmatter: parsed.fm, body: parsed.body, injected: false };
  }
  const stat = await fs.stat(full);
  const isTrash = relPath.split(path.sep)[0] === TRASH;
  let title;
  if (isTrash) {
    const cats = await loadCategories();
    title = parseTrashName(path.basename(relPath), cats.map((c) => c.id)).title;
  } else {
    title = path.basename(relPath, ".md");
  }
  const created = new Date(stat.birthtimeMs || stat.mtimeMs).toISOString();
  const modified = new Date(stat.mtimeMs).toISOString();
  const merged = {
    title: parsed.fm?.title || title,
    tags: Array.isArray(parsed.fm?.tags) ? parsed.fm.tags : [],
    created: parsed.fm?.created || created,
    modified: parsed.fm?.modified || modified,
  };
  const passSched = normScheduled(parsed.fm?.scheduled);
  if (passSched) merged.scheduled = passSched;
  const body = parsed.fm ? parsed.body : raw;
  const newRaw = serializeFrontmatter(merged) + body;
  await writeFileTracked(full, newRaw);
  // preserve original mtime so list ordering stays stable
  try { await fs.utimes(full, stat.atime, stat.mtime); } catch {}
  return { frontmatter: merged, body, injected: true };
}

async function writeNote(relPath, { body, title, tags, scheduled, bumpModified = true }) {
  const full = safeJoin(relPath);
  let existing = { fm: null, body: "" };
  try {
    const raw = await fs.readFile(full, "utf8");
    existing = parseFrontmatter(raw);
  } catch {}
  const now = new Date().toISOString();
  const merged = {
    title: title ?? existing.fm?.title ?? path.basename(relPath, ".md"),
    tags: Array.isArray(tags) ? tags : (Array.isArray(existing.fm?.tags) ? existing.fm.tags : []),
    created: existing.fm?.created || now,
    modified: bumpModified ? now : (existing.fm?.modified || now),
  };
  // scheduled: undefined = keep existing; null/"" = clear; string = set
  let nextSched;
  if (scheduled === undefined) nextSched = normScheduled(existing.fm?.scheduled);
  else if (scheduled === null || scheduled === "") nextSched = null;
  else nextSched = normScheduled(scheduled);
  if (nextSched) merged.scheduled = nextSched;
  const newBody = body !== undefined ? body : existing.body;
  const raw = serializeFrontmatter(merged) + newBody;
  await writeFileTracked(full, raw);
  return { frontmatter: merged, body: newBody };
}

async function listAll() {
  const cats = await ensureDirs();
  const ids = cats.map((c) => c.id);
  const allFolders = [...ids, TRASH];
  const root = rootDir();
  const entries = [];
  const dirs = await fs.readdir(root, { withFileTypes: true });
  for (const c of dirs) {
    if (!c.isDirectory()) continue;
    if (!allFolders.includes(c.name)) continue;
    const catDir = path.join(root, c.name);
    const files = await fs.readdir(catDir, { withFileTypes: true });
    for (const f of files) {
      if (!f.isFile() || !f.name.endsWith(".md")) continue;
      const full = path.join(catDir, f.name);
      const stat = await fs.stat(full);
      const isTrash = c.name === TRASH;
      const parsed = isTrash ? parseTrashName(f.name, ids) : null;
      entries.push({
        relPath: path.join(c.name, f.name),
        category: c.name,
        title: isTrash ? parsed.title : f.name.replace(/\.md$/, ""),
        originalCategory: isTrash ? parsed.originalCategory : null,
        updatedAt: stat.mtimeMs,
      });
    }
  }
  return entries;
}

const SEED = [
  { category: "Work", title: "Start Here — Welcome to Brain",
    body: "Brain is a tiny, local-first notes app. Everything you write lives as a plain `.md` file in your Documents/Brain folder — no account, no cloud, no lock-in.\n\nThis welcome note links to short guides that both explain and demonstrate each feature. Click any link below to open it.\n\n## The basics\n- [[Checkboxes — how they work]]\n- [[Tags & frontmatter]]\n- [[Wikilinks & backlinks]]\n- [[Import, export & local storage]]\n- [[Editing outside the app (Obsidian, VS Code)]]\n\n## Power features\n- [[Quick capture from anywhere (⌘⇧N)]] — jot a thought without leaving what you're doing.\n- [[Search across all notes (⌘K)]] — command-palette search over every note in the vault.\n\n## Try it right now\n1. Click the checkbox below — it saves instantly to disk.\n2. Click the tag chip at the top of this note to add another.\n3. Press `⌘K` and type a word from any other note.\n4. Click [[Checkboxes — how they work]] to jump to another note.\n\n- [ ] I clicked a checkbox\n- [ ] I added a tag\n- [ ] I opened ⌘K search\n- [ ] I followed a wikilink\n\nWhen you're done exploring, you can delete these notes — or keep them as a cheat sheet. See also: [[Keyboard & navigation tips]]." },

  { category: "Work", title: "Checkboxes — how they work",
    body: "Any line that starts with `- [ ]` or `- [x]` is rendered as a real, clickable checkbox. Click it and Brain rewrites that exact line in the `.md` file — nothing else is reformatted or reordered.\n\n## Try it\n- [ ] Click me\n- [x] I'm already done\n- [ ] Edit this note in any text editor, change `[ ]` to `[x]`, save — Brain picks it up live.\n\n## Why this matters\nThe file stays valid GitHub-Flavored Markdown, so the same list works in Obsidian, GitHub, VS Code preview, etc.\n\nRelated: [[Tags & frontmatter]], [[Editing outside the app (Obsidian, VS Code)]]." },

  { category: "Work", title: "Tags & frontmatter",
    body: "Every note begins with a small YAML block (frontmatter) that stores `title`, `tags`, `created`, and `modified`. You never see the raw YAML — Brain shows tags as chips at the top of the note and a subtle \"edited X min ago\" stamp.\n\n## Try it\n- Click `+ tag` above and add `demo`.\n- Click the × on a chip to remove it.\n- Open this `.md` file in any editor — you'll see a clean YAML block at the top, fully compatible with Obsidian.\n\n## Why frontmatter\nIt makes your notes portable. Other PKM tools (Obsidian, Logseq, Foam, static-site generators) all read the same fields.\n\nRelated: [[Wikilinks & backlinks]]." },

  { category: "Work", title: "Wikilinks & backlinks",
    body: "Type `[[` anywhere and Brain pops up an autocomplete of existing note titles. Pick one to insert a link like [[Start Here — Welcome to Brain]]. If no note matches, Brain offers to create it.\n\n## Try it\n1. At the end of this line, type `[[che` and pick a suggestion → \n2. Click any link below to jump:\n   - [[Checkboxes — how they work]]\n   - [[Tags & frontmatter]]\n   - [[A note that does not exist yet]]  ← clicking this offers to create it\n\n## Backlinks\nScroll to the bottom of any note to see **Linked mentions** — every other note that mentions this one by title. That's how knowledge connects over time.\n\nRelated: [[Keyboard & navigation tips]]." },

  { category: "Work", title: "Import, export & local storage",
    body: "Brain stores everything as plain `.md` files inside your **Documents/Brain** folder. No login, no sync server, no telemetry — your notes never leave your machine.\n\n## Export\nUse the export button in the toolbar to save **everything** (notes + categories) as a single JSON file. Good for backups or moving to another machine.\n\n## Import\nPick a previously exported JSON file. Existing notes are kept; new ones are added.\n\n## Just want the files?\nOpen `~/Documents/Brain` in Finder. Each category is a folder, each note is a `.md` file. Copy them anywhere — Dropbox, iCloud, a USB stick, a Git repo.\n\nRelated: [[Editing outside the app (Obsidian, VS Code)]]." },

  { category: "Work", title: "Editing outside the app (Obsidian, VS Code)",
    body: "Because notes are plain Markdown with YAML frontmatter, you can point **Obsidian**, **VS Code**, **iA Writer**, or any text editor at `~/Documents/Brain` and edit there too.\n\nBrain watches the folder. When you save a file elsewhere:\n- New notes appear in the sidebar.\n- Edits to the body, checkboxes, or tags show up live in Brain.\n- Renames and deletes are reflected too.\n\n## Tip\nPoint Obsidian's vault at `~/Documents/Brain` and you get graph view, mobile sync (via your own iCloud/Dropbox), and Brain's clean UI on the desktop — all on the same files.\n\nRelated: [[Tags & frontmatter]], [[Checkboxes — how they work]]." },

  { category: "Work", title: "Keyboard & navigation tips",
    body: "## Global\n- **`⌘K`** → open search from anywhere. Type to filter, `↑/↓` to move, `↵` to open, `Esc` to close. See [[Search across all notes (⌘K)]].\n- **`⌘⇧N`** → open Quick Capture, even when Brain isn't focused. See [[Quick capture from anywhere (⌘⇧N)]].\n- **`⌘⇧R`** → toggle Edit / Read mode on the current note.\n\n## Inside a note\n- **Click a wikilink** → jump to that note.\n- **Type `[[`** → autocomplete of existing titles. `↑/↓` to choose, `↵` or `Tab` to insert, `Esc` to dismiss.\n- **Click a tag chip** → remove it; **`+ tag`** → add one.\n- **Click a checkbox** → toggle and save.\n\n## Sidebar & list\n- **Drag a note** to another category in the sidebar to move it.\n- **Delete** moves to Trash (recoverable); deleting from Trash is permanent.\n\nRelated: [[Start Here — Welcome to Brain]]." },

  { category: "Work", title: "Search across all notes (⌘K)",
    body: "Press **`⌘K`** anywhere in Brain to open a command-palette-style search. It works across **every category** in your vault — not just the one you're viewing — and is instant even with hundreds of notes.\n\n## How it works\n- Matches against both the note **title** and the full **body text**.\n- Case-insensitive substring matching, so partial words work.\n- Results show the note title, its category, and a short snippet with the match highlighted.\n- Notes in Trash are excluded.\n\n## Keyboard\n- `↑` / `↓` — move selection\n- `↵` — open the highlighted note (and close the palette)\n- `Esc` — close without navigating\n- Clicking a row works too\n\n## Find open todos across the vault\nTick **\"Has unchecked items\"** at the top of the palette to only show notes that contain at least one `- [ ]` line. Perfect for jumping into a shopping list, a reading list, or that half-finished project you forgot about.\n\n## Try it\n1. Press `⌘K`.\n2. Type `sourdough` — you should see [[Sourdough Schedule]].\n3. Clear the query, tick **Has unchecked items**, and browse every open list at once.\n\nThe index is built in memory when Brain launches and stays in sync with disk changes — search stays fast as your vault grows.\n\nRelated: [[Quick capture from anywhere (⌘⇧N)]], [[Keyboard & navigation tips]]." },

  { category: "Work", title: "Quick capture from anywhere (⌘⇧N)",
    body: "Press **`⌘⇧N`** from *any* app on your Mac — you don't need Brain to be focused, or even visible — and a small capture window pops up over whatever you're doing.\n\n## How it works\n- Type (or paste) your thought into the auto-focused field.\n- **`⌘↵`** or the **Save** button writes a new `.md` file to the **Inbox** category.\n- **`Esc`** cancels without saving.\n- The window hides on blur — it never steals focus back to Brain.\n\nThe first line of what you type becomes the note title; the rest becomes the body. The new note appears in Brain's main window automatically thanks to the two-way disk sync — no manual refresh needed.\n\n## Why an \"Inbox\"\nQuick capture is for **getting things out of your head**, not organizing. Everything lands in `Inbox`, and later you can drag it into the right category, add tags, or flesh it out. Think of it as your daily triage queue.\n\n## Try it\n1. Press `⌘⇧N` from anywhere.\n2. Type: `remember to try Brain's search — ⌘K`.\n3. Press `⌘↵`.\n4. Open the **Inbox** category in the sidebar — your note is there.\n\nRelated: [[Search across all notes (⌘K)]], [[Keyboard & navigation tips]]." },

  { category: "Hobbies", title: "Reading List",
    body: "A normal note, to show how you'd actually use Brain day-to-day.\n\n## Want to read\n- [ ] The Pragmatic Programmer\n- [ ] Steal Like an Artist\n- [ ] The Creative Act — Rick Rubin\n- [ ] A Pattern Language\n\n## Done\n- [x] Designing Data-Intensive Applications\n\nTip: link a book to its own note with `[[Book title]]` for notes & quotes. See [[Wikilinks & backlinks]]." },

  { category: "Hobbies", title: "Sourdough Schedule",
    body: "Friday evening — feed starter\nSaturday morning — mix dough\nSaturday afternoon — bulk + fold\nSunday morning — bake at 250°C\n\n- [ ] Feed starter\n- [ ] Mix dough\n- [ ] Bulk ferment 4h\n- [ ] Shape & cold proof overnight\n- [ ] Bake" },

  { category: "Shopping", title: "Groceries",
    body: "Checkboxes are perfect for shopping lists — tap as you go, they save instantly.\n\n- [ ] Eggs\n- [ ] Spinach\n- [ ] Olive oil\n- [ ] Greek yogurt\n- [ ] Coffee beans\n- [ ] Lemons\n\nSee [[Checkboxes — how they work]] for details." },

  { category: "Shopping", title: "Hardware Store",
    body: "- [ ] 3M command strips\n- [ ] AA batteries\n- [ ] LED bulb (E27, warm white)\n- [ ] Picture hooks" },
];

async function seedIfEmpty() {
  await ensureDirs();
  const entries = await listAll();
  if (entries.length > 0) return false;
  for (const n of SEED) {
    const p = path.join(rootDir(), n.category, sanitize(n.title) + ".md");
    const now = new Date().toISOString();
    const fm = serializeFrontmatter({ title: n.title, tags: [], created: now, modified: now });
    await writeFileTracked(p, fm + n.body);
  }
  return true;
}

async function trashNote(relPath) {
  const cats = await loadCategories();
  const ids = cats.map((c) => c.id);
  const root = rootDir();
  const oldFull = safeJoin(relPath);
  const parts = relPath.split(path.sep);
  const cat = parts[0];
  if (cat === TRASH) return { relPath };
  const filename = parts.slice(1).join(path.sep).replace(/\.md$/, "");
  const newBase = `${ids.includes(cat) ? cat : (ids[0] || "Work")}${TRASH_SEP}${filename}`;
  const trashDir = path.join(root, TRASH);
  await fs.mkdir(trashDir, { recursive: true });
  const target = await uniquePath(trashDir, newBase, ".md");
  await renameTracked(oldFull, target);
  return { relPath: path.relative(root, target) };
}

async function restoreNote(relPath) {
  const cats = await loadCategories();
  const ids = cats.map((c) => c.id);
  const root = rootDir();
  const oldFull = safeJoin(relPath);
  const parts = relPath.split(path.sep);
  if (parts[0] !== TRASH) return { relPath };
  const parsed = parseTrashName(parts[parts.length - 1], ids);
  const cat = ids.includes(parsed.originalCategory) ? parsed.originalCategory : (ids[0] || "Work");
  const dir = path.join(root, cat);
  await fs.mkdir(dir, { recursive: true });
  const target = await uniquePath(dir, sanitize(parsed.title), ".md");
  await renameTracked(oldFull, target);
  return { relPath: path.relative(root, target) };
}

async function exportAll() {
  const win = BrowserWindow.getFocusedWindow();
  const res = await dialog.showSaveDialog(win, {
    title: "Export Brain",
    defaultPath: `Brain-export-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (res.canceled || !res.filePath) return { ok: false };
  const cats = await loadCategories();
  const entries = await listAll();
  const notes = [];
  for (const e of entries) {
    const body = await fs.readFile(path.join(rootDir(), e.relPath), "utf8");
    notes.push({
      category: e.category,
      originalCategory: e.originalCategory,
      title: e.title,
      body,
      updatedAt: e.updatedAt,
    });
  }
  await fs.writeFile(res.filePath, JSON.stringify({ version: 2, exportedAt: Date.now(), categories: cats, notes }, null, 2), "utf8");
  return { ok: true, path: res.filePath, count: notes.length };
}

async function importAll() {
  const win = BrowserWindow.getFocusedWindow();
  const res = await dialog.showOpenDialog(win, {
    title: "Import Brain",
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (res.canceled || !res.filePaths?.[0]) return { ok: false };
  const raw = await fs.readFile(res.filePaths[0], "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data?.notes)) throw new Error("Invalid export file");
  let cats = await loadCategories();
  if (Array.isArray(data.categories)) {
    for (const c of data.categories) {
      if (!c?.id) continue;
      const safeId = sanitizeCategoryId(c.id);
      if (!safeId || safeId === TRASH) continue;
      if (!cats.find((x) => x.id.toLowerCase() === safeId.toLowerCase())) {
        cats.push({ id: safeId, name: c.name || safeId, color: c.color || "#8e8e93" });
      }
    }
    await saveCategories(cats);
  }
  await ensureDirs();
  const ids = cats.map((c) => c.id);
  let imported = 0;
  for (const n of data.notes) {
    const rawCat = n.category === TRASH ? TRASH : sanitizeCategoryId(n.category || "");
    const cat = rawCat === TRASH ? TRASH : (ids.includes(rawCat) ? rawCat : (ids[0] || "Work"));
    const dir = safeJoin(cat);
    await fs.mkdir(dir, { recursive: true });
    const baseTitle = sanitize(n.title || "Untitled");
    const safeOrig = sanitizeCategoryId(n.originalCategory || "");
    const base = cat === TRASH
      ? `${safeOrig && ids.includes(safeOrig) ? safeOrig : (ids[0] || "Work")}${TRASH_SEP}${baseTitle}`
      : baseTitle;
    const target = await uniquePath(dir, base, ".md");
    await writeFileTracked(target, n.body || "");
    imported++;
  }

  return { ok: true, count: imported };
}

// ----- File watcher -----
let watcher = null;
let watchTimer = null;
const pendingChanges = new Set();
function startWatcher() {
  if (watcher) return;
  try {
    watcher = fssync.watch(rootDir(), { recursive: true }, (event, filename) => {
      if (!filename) return;
      const norm = filename.replace(/\\/g, path.sep);
      if (!norm.endsWith(".md")) return;
      const full = path.join(rootDir(), norm);
      if (isSelfWrite(full)) return;
      pendingChanges.add(norm);
      clearTimeout(watchTimer);
      watchTimer = setTimeout(() => {
        const changed = Array.from(pendingChanges);
        pendingChanges.clear();
        BrowserWindow.getAllWindows().forEach((w) => {
          w.webContents.send("brain:changed", { paths: changed });
        });
      }, 200);
    });
  } catch (e) {
    console.warn("watch failed", e);
  }
}

async function ensureInboxCategory() {
  const cats = await loadCategories();
  if (!cats.find((c) => c.id.toLowerCase() === INBOX.toLowerCase())) {
    cats.push({ id: INBOX, name: INBOX, color: "#af52de" });
    await saveCategories(cats);
  }
  await fs.mkdir(path.join(rootDir(), INBOX), { recursive: true });
}

function pad(n) { return String(n).padStart(2, "0"); }
function timestampSlug(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function quickCapture(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { ok: false };
  await ensureInboxCategory();
  const firstLine = trimmed.split(/\r?\n/)[0].trim();
  const derived = sanitize(firstLine.replace(/^#+\s*/, "").slice(0, 60) || "quick note");
  const base = `${timestampSlug()}-${derived}`;
  const dir = safeJoin(INBOX);
  const target = await uniquePath(dir, base, ".md");
  const now = new Date().toISOString();
  const title = path.basename(target, ".md");
  const fm = serializeFrontmatter({ title, tags: [], created: now, modified: now });
  await writeFileTracked(target, fm + trimmed + "\n");
  return { ok: true, relPath: path.relative(rootDir(), target) };
}

// ----- Quick-capture window -----
let captureWin = null;
function createCaptureWindow() {
  if (captureWin && !captureWin.isDestroyed()) return captureWin;
  captureWin = new BrowserWindow({
    width: 600,
    height: 200,
    center: true,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    transparent: true,
    backgroundColor: "#00000000",
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "quick-capture-preload.cjs"),
    },
  });
  captureWin.setAlwaysOnTop(true, "floating");
  captureWin.loadFile(path.join(__dirname, "quick-capture.html"));
  captureWin.on("blur", () => {
    if (captureWin && !captureWin.isDestroyed()) captureWin.hide();
  });
  captureWin.on("closed", () => { captureWin = null; });
  return captureWin;
}

function showCaptureWindow() {
  const win = createCaptureWindow();
  if (win.isVisible()) { win.focus(); return; }
  win.center();
  const notify = () => win.webContents.send("brain:quickCaptureShown");
  win.show();
  win.focus();
  if (win.webContents.isLoading()) win.webContents.once("did-finish-load", notify);
  else notify();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 480,
    title: "Brain",
    titleBarStyle: "hiddenInset",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  win.loadFile(path.join(__dirname, "index.html"));

  // Native spellcheck context menu (Word/Notes style: suggestions + Add to Dictionary + standard editing)
  win.webContents.on("context-menu", (_event, params) => {
    const menu = new Menu();
    const { isEditable, misspelledWord, dictionarySuggestions, selectionText, editFlags } = params;

    if (isEditable && misspelledWord && dictionarySuggestions && dictionarySuggestions.length) {
      for (const suggestion of dictionarySuggestions) {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion),
        }));
      }
      menu.append(new MenuItem({ type: "separator" }));
      menu.append(new MenuItem({
        label: `Add “${misspelledWord}” to Dictionary`,
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(misspelledWord),
      }));
      menu.append(new MenuItem({ type: "separator" }));
    } else if (isEditable && misspelledWord) {
      menu.append(new MenuItem({ label: "No spelling suggestions", enabled: false }));
      menu.append(new MenuItem({ type: "separator" }));
      menu.append(new MenuItem({
        label: `Add “${misspelledWord}” to Dictionary`,
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(misspelledWord),
      }));
      menu.append(new MenuItem({ type: "separator" }));
    }

    if (isEditable || selectionText) {
      menu.append(new MenuItem({ label: "Cut", role: "cut", enabled: !!editFlags.canCut }));
      menu.append(new MenuItem({ label: "Copy", role: "copy", enabled: !!editFlags.canCopy }));
      if (isEditable) {
        menu.append(new MenuItem({ label: "Paste", role: "paste", enabled: !!editFlags.canPaste }));
        menu.append(new MenuItem({ label: "Paste and Match Style", role: "pasteAndMatchStyle", enabled: !!editFlags.canPaste }));
        menu.append(new MenuItem({ label: "Select All", role: "selectAll" }));
      }
    }

    if (params.linkURL) {
      const isSafeHttp = /^https?:\/\//i.test(params.linkURL);
      if (menu.items.length) menu.append(new MenuItem({ type: "separator" }));
      menu.append(new MenuItem({
        label: "Copy Link",
        click: () => clipboard.writeText(params.linkURL),
      }));
      if (isSafeHttp) {
        menu.append(new MenuItem({
          label: "Open Link in Browser",
          click: () => shell.openExternal(params.linkURL),
        }));
      }
    }


    if (menu.items.length) menu.popup({ window: win });
  });
}

app.whenReady().then(async () => {
  await ensureDirs();

  ipcMain.handle("brain:list", () => listAll());
  ipcMain.handle("brain:categories", () => loadCategories());
  ipcMain.handle("brain:addCategory", (_e, payload) => addCategory(payload || {}));
  ipcMain.handle("brain:reorderCategories", (_e, orderedIds) => reorderCategories(orderedIds));
  ipcMain.handle("brain:read", async (_e, relPath) => {
    // Legacy raw read (no frontmatter stripping). Kept for backward compat.
    return await readNoteRaw(relPath);
  });
  ipcMain.handle("brain:readNote", async (_e, relPath) => ensureFrontmatter(relPath));
  ipcMain.handle("brain:writeNote", async (_e, { relPath, body, title, tags, scheduled, bumpModified }) =>
    writeNote(relPath, { body, title, tags, scheduled, bumpModified }),
  );
  ipcMain.handle("brain:write", async (_e, { relPath, body }) => {
    // Legacy: write raw body without touching frontmatter.
    const full = safeJoin(relPath);
    await writeFileTracked(full, body);
    return true;
  });
  ipcMain.handle("brain:create", async (_e, { category, title, body }) => {
    const cats = await ensureDirs();
    const ids = cats.map((c) => c.id);
    const cat = ids.includes(category) ? category : (ids[0] || "Work");
    const dir = path.join(rootDir(), cat);
    const full = await uniquePath(dir, sanitize(title || "Untitled"), ".md");
    const now = new Date().toISOString();
    const fm = serializeFrontmatter({ title: title || "Untitled", tags: [], created: now, modified: now });
    await writeFileTracked(full, fm + (body || ""));
    return { relPath: path.relative(rootDir(), full), category: cat, title: path.basename(full, ".md") };
  });
  ipcMain.handle("brain:rename", async (_e, { relPath, newTitle, newCategory }) => {
    const cats = await loadCategories();
    const ids = cats.map((c) => c.id);
    const oldFull = safeJoin(relPath);
    const currentCat = relPath.split(path.sep)[0];
    let finalPath;
    if (currentCat === TRASH) {
      const dir = path.join(rootDir(), TRASH);
      const parsed = parseTrashName(path.basename(relPath), ids);
      const base = `${parsed.originalCategory}${TRASH_SEP}${sanitize(newTitle || "Untitled")}`;
      let target = path.join(dir, base + ".md");
      if (target !== oldFull && fssync.existsSync(target)) target = await uniquePath(dir, base, ".md");
      if (target !== oldFull) await renameTracked(oldFull, target);
      finalPath = target;
    } else {
      const cat = ids.includes(newCategory) ? newCategory : currentCat;
      const dir = path.join(rootDir(), cat);
      await fs.mkdir(dir, { recursive: true });
      const base = sanitize(newTitle || "Untitled");
      let target = path.join(dir, base + ".md");
      if (target !== oldFull && fssync.existsSync(target)) {
        target = await uniquePath(dir, base, ".md");
      }
      if (target !== oldFull) {
        await renameTracked(oldFull, target);
      }
      finalPath = target;
    }
    // sync frontmatter title
    try {
      const rel = path.relative(rootDir(), finalPath);
      const newTitleOnDisk = path.basename(finalPath, ".md");
      await writeNote(rel, { title: newTitleOnDisk });
    } catch (e) { /* ignore */ }
    const finalCat = path.relative(rootDir(), finalPath).split(path.sep)[0];
    return { relPath: path.relative(rootDir(), finalPath), category: finalCat, title: path.basename(finalPath, ".md") };
  });
  ipcMain.handle("brain:trash", async (_e, relPath) => trashNote(relPath));
  ipcMain.handle("brain:restore", async (_e, relPath) => restoreNote(relPath));
  ipcMain.handle("brain:seed", () => seedIfEmpty());
  ipcMain.handle("brain:root", () => rootDir());
  ipcMain.handle("brain:reveal", async (_e, relPath) => {
    const target = relPath ? safeJoin(relPath) : rootDir();
    shell.showItemInFolder(target);
    return true;
  });
  ipcMain.handle("brain:export", () => exportAll());
  ipcMain.handle("brain:import", () => importAll());
  ipcMain.handle("brain:setTheme", (_e, mode) => {
    if (["light", "dark", "system"].includes(mode)) {
      nativeTheme.themeSource = mode;
      return true;
    }
    return false;
  });
  ipcMain.handle("brain:getTheme", () => ({
    source: nativeTheme.themeSource,
    isDark: nativeTheme.shouldUseDarkColors,
  }));

  ipcMain.handle("brain:quickCapture", async (_e, text) => {
    const res = await quickCapture(text);
    if (captureWin && !captureWin.isDestroyed()) captureWin.hide();
    if (res.ok) {
      BrowserWindow.getAllWindows().forEach((w) => {
        if (w !== captureWin) w.webContents.send("brain:changed", { paths: [res.relPath] });
      });
    }
    return res;
  });
  ipcMain.on("brain:quickCaptureCancel", () => {
    if (captureWin && !captureWin.isDestroyed()) captureWin.hide();
  });

  await ensureInboxCategory();
  createWindow();
  startWatcher();
  createCaptureWindow();

  const registered = globalShortcut.register(QUICK_CAPTURE_HOTKEY, showCaptureWindow);
  if (!registered) console.warn("Failed to register quick-capture hotkey", QUICK_CAPTURE_HOTKEY);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
