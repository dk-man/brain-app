const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const fssync = require("fs");

const CATEGORIES = ["Work", "Hobbies", "Shopping"];
const TRASH = "Trash";
const ALL_FOLDERS = [...CATEGORIES, TRASH];
const TRASH_SEP = "__";

function rootDir() {
  return path.join(app.getPath("documents"), "Brain");
}

function sanitize(name) {
  return String(name || "Untitled")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "Untitled";
}

async function ensureDirs() {
  const root = rootDir();
  await fs.mkdir(root, { recursive: true });
  for (const c of ALL_FOLDERS) {
    await fs.mkdir(path.join(root, c), { recursive: true });
  }
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

function parseTrashName(filename) {
  // "Work__Title.md" -> { originalCategory: "Work", title: "Title" }
  const base = filename.replace(/\.md$/, "");
  const idx = base.indexOf(TRASH_SEP);
  if (idx > 0) {
    const cat = base.slice(0, idx);
    if (CATEGORIES.includes(cat)) {
      return { originalCategory: cat, title: base.slice(idx + TRASH_SEP.length) };
    }
  }
  return { originalCategory: "Work", title: base };
}

async function listAll() {
  await ensureDirs();
  const root = rootDir();
  const entries = [];
  const cats = await fs.readdir(root, { withFileTypes: true });
  for (const c of cats) {
    if (!c.isDirectory()) continue;
    if (!ALL_FOLDERS.includes(c.name)) continue;
    const catDir = path.join(root, c.name);
    const files = await fs.readdir(catDir, { withFileTypes: true });
    for (const f of files) {
      if (!f.isFile() || !f.name.endsWith(".md")) continue;
      const full = path.join(catDir, f.name);
      const stat = await fs.stat(full);
      const isTrash = c.name === TRASH;
      const parsed = isTrash ? parseTrashName(f.name) : null;
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
  { category: "Work", title: "Q3 Priorities",
    body: "Top focus areas for the quarter:\n\n• Ship onboarding redesign\n• Hire one senior engineer\n• Cut p95 latency by 30%\n\nReview every Friday." },
  { category: "Work", title: "Meeting Notes — Kickoff",
    body: "Attendees: A, B, C\n\nDecisions:\n— Launch target: Sep 15\n— Owner: me\n— Weekly sync on Tuesdays" },
  { category: "Hobbies", title: "Reading List",
    body: "1. The Pragmatic Programmer\n2. Steal Like an Artist\n3. The Creative Act — Rick Rubin\n4. A Pattern Language" },
  { category: "Hobbies", title: "Sourdough Schedule",
    body: "Friday evening — feed starter\nSaturday morning — mix dough\nSaturday afternoon — bulk + fold\nSunday morning — bake at 250°C" },
  { category: "Shopping", title: "Groceries",
    body: "- [ ] Eggs\n- [ ] Spinach\n- [ ] Olive oil\n- [ ] Greek yogurt\n- [ ] Coffee beans\n- [ ] Lemons" },
  { category: "Shopping", title: "Hardware Store",
    body: "- [ ] 3M command strips\n- [ ] AA batteries\n- [ ] LED bulb (E27, warm white)\n- [ ] Picture hooks" },
];

async function seedIfEmpty() {
  await ensureDirs();
  const entries = await listAll();
  if (entries.length > 0) return false;
  for (const n of SEED) {
    const p = path.join(rootDir(), n.category, sanitize(n.title) + ".md");
    await fs.writeFile(p, n.body, "utf8");
  }
  return true;
}

async function trashNote(relPath) {
  const root = rootDir();
  const oldFull = path.join(root, relPath);
  const parts = relPath.split(path.sep);
  const cat = parts[0];
  if (cat === TRASH) return { relPath };
  const filename = parts.slice(1).join(path.sep).replace(/\.md$/, "");
  const newBase = `${CATEGORIES.includes(cat) ? cat : "Work"}${TRASH_SEP}${filename}`;
  const trashDir = path.join(root, TRASH);
  await fs.mkdir(trashDir, { recursive: true });
  const target = await uniquePath(trashDir, newBase, ".md");
  await fs.rename(oldFull, target);
  return { relPath: path.relative(root, target) };
}

async function restoreNote(relPath) {
  const root = rootDir();
  const oldFull = path.join(root, relPath);
  const parts = relPath.split(path.sep);
  if (parts[0] !== TRASH) return { relPath };
  const parsed = parseTrashName(parts[parts.length - 1]);
  const dir = path.join(root, parsed.originalCategory);
  await fs.mkdir(dir, { recursive: true });
  const target = await uniquePath(dir, sanitize(parsed.title), ".md");
  await fs.rename(oldFull, target);
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
  await fs.writeFile(res.filePath, JSON.stringify({ version: 1, exportedAt: Date.now(), notes }, null, 2), "utf8");
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
  await ensureDirs();
  let imported = 0;
  for (const n of data.notes) {
    const cat = n.category === TRASH ? TRASH : (CATEGORIES.includes(n.category) ? n.category : "Work");
    const dir = path.join(rootDir(), cat);
    await fs.mkdir(dir, { recursive: true });
    const baseTitle = sanitize(n.title || "Untitled");
    const base = cat === TRASH
      ? `${CATEGORIES.includes(n.originalCategory) ? n.originalCategory : "Work"}${TRASH_SEP}${baseTitle}`
      : baseTitle;
    const target = await uniquePath(dir, base, ".md");
    await fs.writeFile(target, n.body || "", "utf8");
    imported++;
  }
  return { ok: true, count: imported };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 480,
    title: "Brain",
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1e1e1e",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(async () => {
  await ensureDirs();

  ipcMain.handle("brain:list", () => listAll());
  ipcMain.handle("brain:read", async (_e, relPath) => {
    return await fs.readFile(path.join(rootDir(), relPath), "utf8");
  });
  ipcMain.handle("brain:write", async (_e, { relPath, body }) => {
    await fs.writeFile(path.join(rootDir(), relPath), body, "utf8");
    return true;
  });
  ipcMain.handle("brain:create", async (_e, { category, title, body }) => {
    await ensureDirs();
    const cat = CATEGORIES.includes(category) ? category : "Work";
    const dir = path.join(rootDir(), cat);
    const full = await uniquePath(dir, sanitize(title || "Untitled"), ".md");
    await fs.writeFile(full, body || "", "utf8");
    return { relPath: path.relative(rootDir(), full), category: cat, title: path.basename(full, ".md") };
  });
  ipcMain.handle("brain:rename", async (_e, { relPath, newTitle, newCategory }) => {
    const oldFull = path.join(rootDir(), relPath);
    const currentCat = relPath.split(path.sep)[0];
    // Don't move trashed items via rename
    if (currentCat === TRASH) {
      const dir = path.join(rootDir(), TRASH);
      const parsed = parseTrashName(path.basename(relPath));
      const base = `${parsed.originalCategory}${TRASH_SEP}${sanitize(newTitle || "Untitled")}`;
      let target = path.join(dir, base + ".md");
      if (target !== oldFull && fssync.existsSync(target)) target = await uniquePath(dir, base, ".md");
      if (target !== oldFull) await fs.rename(oldFull, target);
      return { relPath: path.relative(rootDir(), target), category: TRASH, title: sanitize(newTitle || "Untitled") };
    }
    const cat = CATEGORIES.includes(newCategory) ? newCategory : currentCat;
    const dir = path.join(rootDir(), cat);
    await fs.mkdir(dir, { recursive: true });
    const base = sanitize(newTitle || "Untitled");
    let target = path.join(dir, base + ".md");
    if (target !== oldFull && fssync.existsSync(target)) {
      target = await uniquePath(dir, base, ".md");
    }
    if (target !== oldFull) {
      await fs.rename(oldFull, target);
    }
    return { relPath: path.relative(rootDir(), target), category: cat, title: path.basename(target, ".md") };
  });
  ipcMain.handle("brain:trash", async (_e, relPath) => trashNote(relPath));
  ipcMain.handle("brain:restore", async (_e, relPath) => restoreNote(relPath));
  ipcMain.handle("brain:seed", () => seedIfEmpty());
  ipcMain.handle("brain:root", () => rootDir());
  ipcMain.handle("brain:reveal", async (_e, relPath) => {
    const target = relPath ? path.join(rootDir(), relPath) : rootDir();
    shell.showItemInFolder(target);
    return true;
  });
  ipcMain.handle("brain:export", () => exportAll());
  ipcMain.handle("brain:import", () => importAll());

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
