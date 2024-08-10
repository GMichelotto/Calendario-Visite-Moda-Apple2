const { contextBridge, ipcRenderer } = require('electron');

// Esponi le funzionalità sicure al rendering process
contextBridge.exposeInMainWorld('electronAPI', {
  // Aggiungi qui le funzioni che vuoi rendere disponibili al tuo codice React
  // Esempio:
  // sendMessage: (message) => ipcRenderer.send('send-message', message),
  // onReceiveMessage: (callback) => ipcRenderer.on('receive-message', callback)
});
