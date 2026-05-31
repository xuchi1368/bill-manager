const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { fork, spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let tray;
let serverProcess;

// Find system Node.js — prefer bundled node.exe in resources, fall back to electron's node
function findSystemNode() {
  // In packaged app: resources/node.exe (bundled with build)
  const bundled = path.join(process.resourcesPath, 'node.exe');
  if (fs.existsSync(bundled)) {
    console.log('Using bundled Node.js:', bundled);
    return bundled;
  }
  // In dev: use the node that started electron (system node)
  // process.execPath is electron.exe; system node is typically on PATH
  console.log('Bundled Node.js not found, using system Node');
  return 'node';
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server.js');
    const nodeExe = findSystemNode();

    // Use spawn with system Node instead of fork (fork uses electron's Node)
    serverProcess = spawn(nodeExe, [serverPath], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, NODE_ENV: 'production' },
    });

    let started = false;

    serverProcess.on('message', (msg) => {
      if (msg === 'ready' && !started) {
        started = true;
        console.log('Next.js server ready');
        resolve();
      }
    });

    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
      if (!started) reject(err);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('[server]', data.toString());
    });

    serverProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      console.log('[server]', text);
      // Detect "Ready" message if IPC doesn't work
      if (!started && text.includes('Ready on')) {
        started = true;
        resolve();
      }
    });

    serverProcess.on('exit', (code) => {
      if (!started) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Timeout fallback — if no 'ready' message in 30s, try anyway
    setTimeout(() => {
      if (!started) {
        console.log('Server start timeout, proceeding anyway');
        resolve();
      }
    }, 30000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '账单管理',
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL('http://localhost:8888');

  // Minimize to tray instead of quitting
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Notify renderer of maximize/unmaximize changes
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximize-change', false);
  });
}

// IPC handlers for custom titlebar window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

// Only skip built-in server when explicitly told (dev mode via npm run electron:dev)
const SKIP_SERVER = process.env.ELECTRON_SKIP_SERVER === '1';

app.whenReady().then(async () => {
  if (!SKIP_SERVER) {
    try {
      await startNextServer();
    } catch (e) {
      console.error('Failed to start server, retrying in dev mode...', e.message);
      const serverPath = path.join(__dirname, 'server.js');
      serverProcess = fork(serverPath, [], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'development' },
      });
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
  } else {
    console.log('Skipping built-in server (ELECTRON_SKIP_SERVER=1)');
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
