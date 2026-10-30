const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  pullUpdate: () => ipcRenderer.invoke('git-pull-update'),
  autoUpdateAndRestart: () => ipcRenderer.invoke('app-update-and-restart'),
});
