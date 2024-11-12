const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  database: {
    operation: (operation, params = {}) => 
      ipcRenderer.invoke('db-operation', { operation, ...params }),
  },
  
  // Other APIs
  platform: process.platform,
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  
  // Error handling
  onError: (callback) => ipcRenderer.on('error', (event, message) => callback(message)),
});
