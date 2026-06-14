const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("brainAPI", {
  list: () => ipcRenderer.invoke("brain:list"),
  categories: () => ipcRenderer.invoke("brain:categories"),
  addCategory: (name, color) => ipcRenderer.invoke("brain:addCategory", { name, color }),
  read: (relPath) => ipcRenderer.invoke("brain:read", relPath),
  write: (relPath, body) => ipcRenderer.invoke("brain:write", { relPath, body }),
  create: (category, title, body) => ipcRenderer.invoke("brain:create", { category, title, body }),
  rename: (relPath, newTitle, newCategory) =>
    ipcRenderer.invoke("brain:rename", { relPath, newTitle, newCategory }),
  trash: (relPath) => ipcRenderer.invoke("brain:trash", relPath),
  restore: (relPath) => ipcRenderer.invoke("brain:restore", relPath),
  seedIfEmpty: () => ipcRenderer.invoke("brain:seed"),
  rootPath: () => ipcRenderer.invoke("brain:root"),
  reveal: (relPath) => ipcRenderer.invoke("brain:reveal", relPath),
  exportAll: () => ipcRenderer.invoke("brain:export"),
  importAll: () => ipcRenderer.invoke("brain:import"),
  setTheme: (mode) => ipcRenderer.invoke("brain:setTheme", mode),
  getTheme: () => ipcRenderer.invoke("brain:getTheme"),
});
