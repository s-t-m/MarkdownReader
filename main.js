// MarkdownReader - Main process (multi-window)
const { app, BrowserWindow, Menu, ipcMain, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs2 = require('fs');
const isDev = !app.isPackaged;
const windows = new Map();
let lastFocusedWindow = null;
function loadSettings() {
  const settingsFile = path.join(app.getPath('userData'), 'settings.json');
  const defaults = { theme: 'auto', toc: true, zoom: 1.0, recent: [] };
  try {
    if (fs2.existsSync(settingsFile)) {
      const data = JSON.parse(fs2.readFileSync(settingsFile, 'utf8'));
      return { ...defaults, ...data };
    }
  } catch (e) {}
  return defaults;
}
let settings = {};
function saveSettings() {
  try {
    const settingsFile = path.join(app.getPath('userData'), 'settings.json');
    fs2.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {}
}
function getRecent() { return settings.recent || []; }
function addRecent(filePath) {
  if (!filePath) return;
  try {
    const stat = fs2.statSync(filePath);
    if (!stat.isFile()) return;
  } catch (e) { return; }
  const recent = (settings.recent || []).filter(p => p !== filePath);
  recent.unshift(filePath);
  settings.recent = recent.slice(0, 15);
  saveSettings();
  updateRecentMenu();
}
function getFocusedWindow() {
  const win = BrowserWindow.getFocusedWindow();
  if (win) return win;
  if (lastFocusedWindow && !lastFocusedWindow.isDestroyed()) return lastFocusedWindow;
  const all = BrowserWindow.getAllWindows();
  return all.length ? all[all.length - 1] : null;
}
function getWinState(win) { return win ? (windows.get(win.id) || null) : null; }
function stopWatching(win) {
  const st = getWinState(win);
  if (st && st.fileWatcher) { try { st.fileWatcher.close(); } catch (e) {} st.fileWatcher = null; }
}
function watchFile(filePath, win) {
  if (!win) return;
  const st = getWinState(win);
  if (!st) return;
  stopWatching(win);
  if (!filePath) return;
  try {
    let lastSize = fs2.statSync(filePath).size;
    let debounce = null;
    st.fileWatcher = fs2.watch(filePath, { persistent: false }, (eventType) => {
      if (eventType !== 'change') return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        try {
          const cur = fs2.statSync(filePath).size;
          if (cur === lastSize) return;
          lastSize = cur;
          const content = fs2.readFileSync(filePath, 'utf8');
          if (win && !win.isDestroyed()) win.webContents.send('file-changed', { path: filePath, content });
        } catch (e) {}
      }, 150);
    });
  } catch (e) {}
}
function updateTitleBarOverlay(theme, win) {
  win = win || getFocusedWindow();
  if (!win) return;
  if (theme === 'dark') { win.setTitleBarOverlay({ color: '#141418', symbolColor: '#c4c4cc' }); }
  else { win.setTitleBarOverlay({ color: '#ececea', symbolColor: '#3f3f44' }); }
}
function openFile(filePath, win) {
  if (!filePath) return;
  win = win || getFocusedWindow();
  if (!win) { createWindow(filePath); return; }
  try {
    const content = fs2.readFileSync(filePath, 'utf8');
    addRecent(filePath);
    const st = getWinState(win);
    if (st) st.currentPath = filePath;
    win.webContents.send('file-opened', { path: filePath, name: path.basename(filePath), content });
    watchFile(filePath, win);
    win.setTitle(path.basename(filePath) + ' - MarkdownReader');
  } catch (e) { dialog.showErrorBox('无法打开文件', String(e.message || e)); }
}
function createWindow(filePath) {
  if (!settings.theme) settings = loadSettings();
  const iconPath = path.join(__dirname, 'MarkdownReader.ico');
  const win = new BrowserWindow({
    width: 1200, height: 800, minWidth: 720, minHeight: 480,
    backgroundColor: '#1e1e2e', show: false, frame: true,
    autoHideMenuBar: true, titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#ececea', symbolColor: '#3f3f44', height: 38 },
    icon: iconPath,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, spellcheck: false }
  });
  windows.set(win.id, { window: win, fileWatcher: null, currentPath: null, fileToOpen: filePath || null });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => { win.show(); updateTitleBarOverlay(settings.theme, win); });
  win.webContents.on('did-finish-load', () => {
    const st = getWinState(win);
    win.webContents.send('apply-settings', settings);
    if (st && st.fileToOpen) { openFile(st.fileToOpen, win); st.fileToOpen = null; }
  });
  win.on('focus', () => { lastFocusedWindow = win; });
  win.on('close', () => { saveSettings(); });
  win.on('closed', () => { stopWatching(win); windows.delete(win.id); if (lastFocusedWindow === win) lastFocusedWindow = null; });
  lastFocusedWindow = win;
  buildMenu();
}
function updateRecentMenu() { buildMenu(); }
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const recent = getRecent();
  const recentSubmenu = recent.length ? recent.map(p => ({ label: path.basename(p) + '  (' + path.dirname(p) + ')', click: () => { openFile(p, getFocusedWindow()); } })).concat([{ type: 'separator' }, { label: '清除最近列表', click: () => { settings.recent = []; saveSettings(); updateRecentMenu(); } }]) : [{ label: '（无）', enabled: false }];
  const template = [{ label: '文件', submenu: [
    { label: '打开…', accelerator: 'CmdOrCtrl+O', click: () => { const win = getFocusedWindow(); const result = dialog.showOpenDialogSync(win, { title: '打开 Markdown 文件', defaultPath: app.getPath('documents'), filters: [{ name: 'Markdown', extensions: ['md','markdown','mdown','mkd','txt'] }, { name: '所有文件', extensions: ['*'] }], properties: ['openFile'] }); if (result && result[0]) openFile(result[0], win); } },
    { label: '打开最近', submenu: recentSubmenu },
    { type: 'separator' },
    { label: '新建窗口', accelerator: 'CmdOrCtrl+Shift+N', click: () => createWindow() },
    { type: 'separator' },
    { label: '重新加载文件', accelerator: 'CmdOrCtrl+R', click: () => { const win = getFocusedWindow(); const st = getWinState(win); if (st && st.currentPath) openFile(st.currentPath, win); }, enabled: (() => { const win = getFocusedWindow(); const st = getWinState(win); return !!(st && st.currentPath); })() },
    { type: 'separator' },
    { label: '关闭窗口', accelerator: 'CmdOrCtrl+W', click: () => { const w = getFocusedWindow(); if (w) w.close(); } },
    { label: '退出', accelerator: isMac ? 'Cmd+Q' : 'Alt+F4', click: () => app.quit() }
  ]}, { label: '视图', submenu: [
    { label: '放大', accelerator: 'CmdOrCtrl+=', click: () => zoomBy(1.1) },
    { label: '缩小', accelerator: 'CmdOrCtrl+-', click: () => zoomBy(1 / 1.1) },
    { label: '重置缩放', accelerator: 'CmdOrCtrl+0', click: () => setZoom(1.0) },
    { type: 'separator' },
    { label: '切换主题', accelerator: 'CmdOrCtrl+Shift+T', click: () => { const w = getFocusedWindow(); if (w) w.webContents.send('toggle-theme'); } },
    { label: '目录', type: 'checkbox', checked: settings.toc, accelerator: 'CmdOrCtrl+Shift+C', click: (mi) => { settings.toc = mi.checked; saveSettings(); const w = getFocusedWindow(); if (w) w.webContents.send('toggle-toc', mi.checked); } },
    { type: 'separator' },
    { label: '查找', accelerator: 'CmdOrCtrl+F', click: () => { const w = getFocusedWindow(); if (w) w.webContents.send('toggle-find'); } },
    { label: '全屏', role: 'togglefullscreen' }
  ]}, { label: '帮助', submenu: [
    { label: '关于 MarkdownReader', click: () => showAbout() },
    { label: '检查更新', click: () => { const w = getFocusedWindow(); if (w) w.webContents.send('apply-settings', settings); } }
  ]}];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
function setZoom(factor) { settings.zoom = factor; saveSettings(); const win = getFocusedWindow(); if (win) win.webContents.setZoomFactor(factor); }
function zoomBy(mult) { let f = (settings.zoom || 1) * mult; f = Math.min(3, Math.max(0.5, f)); setZoom(f); }
function showAbout() { dialog.showMessageBox(getFocusedWindow(), { type: 'info', title: '关于 MarkdownReader', message: 'MarkdownReader', detail: '版本 ' + app.getVersion() + '\n一个美观的 Windows Markdown 阅读器\n\n支持 GitHub 风格 Markdown、代码高亮、数学公式 (KaTeX)、Mermaid 图表。', icon: path.join(__dirname, 'MarkdownReader.ico'), buttons: ['确定'] }); }
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); } else {
  app.on('second-instance', (event, argv) => {
    const p = findFileInArgs(argv);
    if (p) { createWindow(p); } else { const win = getFocusedWindow(); if (win) { if (win.isMinimized()) win.restore(); win.focus(); } }
  });
  app.whenReady().then(() => { const p = findFileInArgs(process.argv); createWindow(p); });
}
function findFileInArgs(argv) {
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a && !a.startsWith('-') && !a.startsWith('--') && a !== process.execPath && !a.endsWith('.exe')) {
      const ext = path.extname(a).toLowerCase().replace('.', '');
      if (['md','markdown','mdown','mkd','txt'].includes(ext)) return a;
    }
  }
  return null;
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
app.on('open-file', (event, filePath) => { event.preventDefault(); createWindow(filePath); });
ipcMain.handle('open-external', async (e, url) => { try { if (/^https?:\/\//i.test(url)) await shell.openExternal(url); } catch (err) {} return true; });
ipcMain.handle('open-file-dialog', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const result = dialog.showOpenDialogSync(win, { title: '打开 Markdown 文件', defaultPath: app.getPath('documents'), filters: [{ name: 'Markdown', extensions: ['md','markdown','mdown','mkd','txt'] }, { name: '所有文件', extensions: ['*'] }], properties: ['openFile'] });
  if (result && result[0]) { openFile(result[0], win); return result[0]; }
  return null;
});
ipcMain.handle('open-recent', async (e, p) => { const win = BrowserWindow.fromWebContents(e.sender); openFile(p, win); return true; });
ipcMain.handle('get-recent', async () => getRecent());
ipcMain.handle('save-settings', async (e, partial) => { settings = { ...settings, ...partial }; saveSettings(); return settings; });
ipcMain.handle('get-settings', async () => ({ ...settings, version: app.getVersion() }));
ipcMain.handle('reveal-file', async (e, p) => { if (p) shell.showItemInFolder(p); return true; });
ipcMain.handle('set-current-path', async (e, p) => { const win = BrowserWindow.fromWebContents(e.sender); const st = getWinState(win); if (st) st.currentPath = p; return true; });
ipcMain.on('print-to-pdf', (e) => { const win = BrowserWindow.fromWebContents(e.sender); if (win) win.webContents.print(); });
ipcMain.handle('set-titlebar-overlay', async (e, theme) => { const win = BrowserWindow.fromWebContents(e.sender); updateTitleBarOverlay(theme, win); return true; });
ipcMain.handle('zoom', async (e, factor) => { setZoom(factor); return settings.zoom; });
ipcMain.handle('export-pdf', async (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return false;
  const st = getWinState(win);
  const cp = st ? st.currentPath : null;
  const result = await dialog.showSaveDialog(win, { title: '导出为 PDF', defaultPath: (cp ? path.basename(cp, path.extname(cp)) : 'document') + '.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (result.canceled || !result.filePath) return false;
  try { const pdfData = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { marginType: 'custom', top: 0, bottom: 0, left: 0, right: 0 } }); fs2.writeFileSync(result.filePath, pdfData); return result.filePath; }
  catch (err) { dialog.showErrorBox('导出失败', String(err.message || err)); return false; }
});
