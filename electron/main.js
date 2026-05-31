const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let tray;
let serverProcess;

function startNextServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = fork(serverPath, [], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production' },
    });

    serverProcess.on('message', (msg) => {
      if (msg === 'ready') {
        console.log('Next.js server ready');
        resolve();
      }
    });

    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
      reject(err);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('[server]', data.toString());
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log('[server]', data.toString());
    });

    // Timeout fallback — if no 'ready' message in 30s, try anyway
    setTimeout(() => resolve(), 30000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '账单管理',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  mainWindow.loadURL('http://localhost:8888');

  // Minimize to tray instead of quitting
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

app.whenReady().then(async () => {
  try {
    await startNextServer();
  } catch (e) {
    console.error('Failed to start server, retrying in dev mode...', e.message);
    // Fallback: try dev mode
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = fork(serverPath, [], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' },
    });
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }

  createWindow();

  // System tray
  try {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const menu = Menu.buildFromTemplate([
      { label: '显示', click: () => mainWindow?.show() },
      { label: '退出', click: () => { app.isQuitting = true; app.quit(); } },
    ]);
    tray.setToolTip('账单管理');
    tray.setContextMenu(menu);
    tray.on('double-click', () => mainWindow?.show());
  } catch (e) {
    console.log('No tray icon, skipping');
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('window-all-closed', () => {});
app.on('activate', () => mainWindow?.show());
