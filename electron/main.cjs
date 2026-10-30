const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// Chromium hardware acceleration & zero-stutter background audio playback flags
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#050608',
    title: 'BREEZY',
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
  });

  const devUrl = 'http://127.0.0.1:5173';
  const distPath = path.join(__dirname, '../dist/index.html');

  // Check if live dev server is active on 5173 for instantaneous updates
  const http = require('http');
  const req = http.get(devUrl, (res) => {
    if (res.statusCode === 200) {
      mainWindow.loadURL(devUrl);
    } else {
      mainWindow.loadFile(distPath);
    }
  });
  req.on('error', () => {
    mainWindow.loadFile(distPath);
  });
  req.setTimeout(800, () => {
    req.destroy();
    mainWindow.loadFile(distPath);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// GitHub 1-Click Auto-Updater & Restart IPC Trigger
ipcMain.handle('git-pull-update', async () => {
  return new Promise((resolve) => {
    exec('git pull origin main', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
});

ipcMain.handle('app-update-and-restart', async () => {
  return new Promise((resolve) => {
    exec('git pull origin main && npm run build', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: stderr || error.message });
      } else {
        // Automatically relaunch the app at the newest version with 0 commands!
        app.relaunch();
        app.exit(0);
        resolve({ success: true, output: stdout });
      }
    });
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
