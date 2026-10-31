const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { startEmbeddedStreamer } = require('./embeddedServer.cjs');

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
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
  });

  const devUrl = 'http://127.0.0.1:5173';
  const distPath = path.join(__dirname, '../dist/index.html');

  // Connect to local stream server (either Vite dev or embedded streamer)
  const http = require('http');
  const tryLoad = (retries = 3) => {
    const req = http.get(devUrl, (res) => {
      if (res.statusCode === 200) {
        mainWindow.loadURL(devUrl);
      } else {
        mainWindow.loadFile(distPath);
      }
    });
    req.on('error', () => {
      if (retries > 0) {
        setTimeout(() => tryLoad(retries - 1), 150);
      } else {
        mainWindow.loadFile(distPath);
      }
    });
    req.setTimeout(800, () => {
      req.destroy();
      if (retries > 0) {
        setTimeout(() => tryLoad(retries - 1), 150);
      } else {
        mainWindow.loadFile(distPath);
      }
    });
  };
  tryLoad();

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
  if (app.isPackaged) {
    shell.openExternal('https://github.com/pietersensamuel088-ship-it/breezy');
    return { success: true, isPackaged: true, output: 'Opened GitHub' };
  }
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
  if (app.isPackaged) {
    shell.openExternal('https://github.com/pietersensamuel088-ship-it/breezy');
    return { success: true, isPackaged: true, output: 'Opened GitHub' };
  }
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
  const distDir = path.join(__dirname, '../dist');
  const songsDir = path.resolve(__dirname, '../nicsongs');
  try {
    startEmbeddedStreamer(5173, distDir, songsDir);
  } catch (e) {
    console.warn('[Embedded Streamer Init]', e.message);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
