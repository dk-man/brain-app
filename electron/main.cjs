const { app, BrowserWindow, ipcMain, shell, dialog, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const fssync = require("fs");

const TRASH = "Trash";
const TRASH_SEP = "__";
const CATEGORIES_FILE = ".categories.json";

const DEFAULT_CATEGORIES = [
  { id: "Work", name: "Work", color: "#0071e3" },
  { id: "Hobbies", name: "Hobbies", color: "#34c759" },
  { id: "Shopping", name: "Shopping", color: "#ff9500" },
];

function rootDir() {
  return path.join(app.getPath("documents"), "Brain");
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

async function loadCategories() {
  await fs.mkdir(rootDir(), { recursive: true });
  try {
    const raw = await fs.readFile(categoriesFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed
        .filter((c) => c && c.id && c.id !== TRASH)
        .map((c) => ({ id: c.id, name: c.name || c.id, color: c.color || "#8e8e93" }));
    }
  } catch {}
  await saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES.slice();
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
  const cats = await loadCategories();
  const ids = cats.map((c) => c.id);
  const root = rootDir();
  const oldFull = path.join(root, relPath);
  const parts = relPath.split(path.sep);
  const cat = parts[0];
  if (cat === TRASH) return { relPath };
  const filename = parts.slice(1).join(path.sep).replace(/\.md$/, "");
  const newBase = `${ids.includes(cat) ? cat : (ids[0] || "Work")}${TRASH_SEP}${filename}`;
  const trashDir = path.join(root, TRASH);
  await fs.mkdir(trashDir, { recursive: true });
  const target = await uniquePath(trashDir, newBase, ".md");
  await fs.rename(oldFull, target);
  return { relPath: path.relative(root, target) };
}

async function restoreNote(relPath) {
  const cats = await loadCategories();
  const ids = cats.map((c) => c.id);
  const root = rootDir();
  const oldFull = path.join(root, relPath);
  const parts = relPath.split(path.sep);
  if (parts[0] !== TRASH) return { relPath };
  const parsed = parseTrashName(parts[parts.length - 1], ids);
  const cat = ids.includes(parsed.originalCategory) ? parsed.originalCategory : (ids[0] || "Work");
  const dir = path.join(root, cat);
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
  // Merge categories
  let cats = await loadCategories();
  if (Array.isArray(data.categories)) {
    for (const c of data.categories) {
      if (!c?.id || c.id === TRASH) continue;
      if (!cats.find((x) => x.id.toLowerCase() === c.id.toLowerCase())) {
        cats.push({ id: c.id, name: c.name || c.id, color: c.color || "#8e8e93" });
      }
    }
    await saveCategories(cats);
  }
  await ensureDirs();
  const ids = cats.map((c) => c.id);
  let imported = 0;
  for (const n of data.notes) {
    const cat = n.category === TRASH ? TRASH : (ids.includes(n.category) ? n.category : (ids[0] || "Work"));
    const dir = path.join(rootDir(), cat);
    await fs.mkdir(dir, { recursive: true });
    const baseTitle = sanitize(n.title || "Untitled");
    const base = cat === TRASH
      ? `${ids.includes(n.originalCategory) ? n.originalCategory : (ids[0] || "Work")}${TRASH_SEP}${baseTitle}`
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
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
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
  ipcMain.handle("brain:categories", () => loadCategories());
  ipcMain.handle("brain:addCategory", (_e, payload) => addCategory(payload || {}));
  ipcMain.handle("brain:read", async (_e, relPath) => {
    return await fs.readFile(path.join(rootDir(), relPath), "utf8");
  });
  ipcMain.handle("brain:write", async (_e, { relPath, body }) => {
    await fs.writeFile(path.join(rootDir(), relPath), body, "utf8");
    return true;
  });
  ipcMain.handle("brain:create", async (_e, { category, title, body }) => {
    const cats = await ensureDirs();
    const ids = cats.map((c) => c.id);
    const cat = ids.includes(category) ? category : (ids[0] || "Work");
    const dir = path.join(rootDir(), cat);
    const full = await uniquePath(dir, sanitize(title || "Untitled"), ".md");
    await fs.writeFile(full, body || "", "utf8");
    return { relPath: path.relative(rootDir(), full), category: cat, title: path.basename(full, ".md") };
  });
  ipcMain.handle("brain:rename", async (_e, { relPath, newTitle, newCategory }) => {
    const cats = await loadCategories();
    const ids = cats.map((c) => c.id);
    const oldFull = path.join(rootDir(), relPath);
    const currentCat = relPath.split(path.sep)[0];
    if (currentCat === TRASH) {
      const dir = path.join(rootDir(), TRASH);
      const parsed = parseTrashName(path.basename(relPath), ids);
      const base = `${parsed.originalCategory}${TRASH_SEP}${sanitize(newTitle || "Untitled")}`;
      let target = path.join(dir, base + ".md");
      if (target !== oldFull && fssync.existsSync(target)) target = await uniquePath(dir, base, ".md");
      if (target !== oldFull) await fs.rename(oldFull, target);
      return { relPath: path.relative(rootDir(), target), category: TRASH, title: sanitize(newTitle || "Untitled") };
    }
    const cat = ids.includes(newCategory) ? newCategory : currentCat;
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

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
