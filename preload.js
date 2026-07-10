// MarkdownReader - Preload bridge (contextIsolation safe)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openRecent: (p) => ipcRenderer.invoke('open-recent', p),
  getRecent: () => ipcRenderer.invoke('get-recent'),
  saveSettings: (partial) => ipcRenderer.invoke('save-settings', partial),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  revealFile: (p) => ipcRenderer.invoke('reveal-file', p),
  setCurrentPath: (p) => ipcRenderer.invoke('set-current-path', p),
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  setZoom: (f) => ipcRenderer.invoke('zoom', f),
  print: () => ipcRenderer.send('print-to-pdf'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  setTitleBarOverlay: (theme) => ipcRenderer.invoke('set-titlebar-overlay', theme),
  onFileOpened: (cb) => ipcRenderer.on('file-opened', (e, d) => cb(d)),
  onFileChanged: (cb) => ipcRenderer.on('file-changed', (e, d) => cb(d)),
  onApplySettings: (cb) => ipcRenderer.on('apply-settings', (e, s) => cb(s)),
  onToggleTheme: (cb) => ipcRenderer.on('toggle-theme', () => cb()),
  onToggleToc: (cb) => ipcRenderer.on('toggle-toc', (e, v) => cb(v)),
  onToggleFind: (cb) => ipcRenderer.on('toggle-find', () => cb())
});
