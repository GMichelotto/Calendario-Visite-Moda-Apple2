const { contextBridge, ipcRenderer } = require('electron');

// Espone le API in modo sicuro al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  database: {
    operation: (operation, data) => ipcRenderer.invoke('db-operation', { operation, ...data }),
  },
  // API per la gestione dei file
  handleFiles: {
    readCSV: (filepath) => ipcRenderer.invoke('read-csv', filepath),
    saveFile: (data, filename) => ipcRenderer.invoke('save-file', { data, filename }),
  },
  // API per la gestione degli eventi di sistema
  system: {
    onError: (callback) => ipcRenderer.on('error', callback),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    platform: process.platform,
  }
});
