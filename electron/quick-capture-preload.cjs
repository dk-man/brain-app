const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("brainCapture", {
  save: (text) => ipcRenderer.invoke("brain:quickCapture", text),
  cancel: () => ipcRenderer.send("brain:quickCaptureCancel"),
  onShown: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("brain:quickCaptureShown", handler);
    return () => ipcRenderer.removeListener("brain:quickCaptureShown", handler);
  },
});
