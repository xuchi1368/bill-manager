const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let tray;
let serverProcess;

function startNextServer() {
  serverProcess = spawn('node_modules/.bin/next', ['start', '-p', '3099'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '账单管理',
    webPreferences: { nodeIntegration: false },
  });

  mainWindow.loadURL('http://localhost:3099');
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  startNextServer();

  setTimeout(createWindow, 3000);

  // system tray — use empty icon or skip if no icon file
  try {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const menu = Menu.buildFromTemplate([
      { label: '显示', click: () => mainWindow?.show() },
      { label: '退出', click: () => { app.isQuitting = true; app.quit(); } },
    ]);
    tray.setToolTip('账单管理');
    tray.setContextMenu(menu);
  } catch (e) {
    console.log('no tray icon file, skipping tray');
  }
});

app.on('window-all-closed', () => {});
app.on('activate', () => mainWindow?.show());
