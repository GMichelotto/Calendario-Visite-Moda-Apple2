// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Utility per gestire le risposte IPC
const invokeOperation = async (operation, data = null) => {
  try {
    const result = await ipcRenderer.invoke('db-operation', { operation, data });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// API esposte al renderer process (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // ========== CLIENTI OPERATIONS ==========
  clienti: {
    getAll: async () => invokeOperation('getClienti'),
    getById: async (id) => invokeOperation('getClienteById', { id }),
    create: async (cliente) => invokeOperation('createCliente', cliente),
    update: async (id, cliente) => invokeOperation('updateCliente', { id, cliente }),
    delete: async (id) => invokeOperation('deleteCliente', { id }),
  },

  // ========== COLLEZIONI OPERATIONS ==========
  collezioni: {
    getAll: async () => invokeOperation('getCollezioni'),
    getById: async (id) => invokeOperation('getCollezioneById', { id }),
    create: async (collezione) => invokeOperation('createCollezione', collezione),
    update: async (id, collezione) => invokeOperation('updateCollezione', { id, collezione }),
    delete: async (id) => invokeOperation('deleteCollezione', { id }),
  },

  // ========== EVENTI OPERATIONS ==========
  eventi: {
    getAll: async () => invokeOperation('getEventi'),
    getById: async (id) => invokeOperation('getEventoById', { id }),
    create: async (evento) => invokeOperation('createEvento', evento),
    update: async (id, evento) => invokeOperation('updateEvento', { id, evento }),
    delete: async (id) => invokeOperation('deleteEvento', { id }),
    validate: async (data) => invokeOperation('validateEventTiming', data),
  },

  // ========== IMPORT/EXPORT OPERATIONS ==========
  import: {
    fromCSV: async (type, content) => invokeOperation('importFromCSV', { type, content }),
  },
  export: {
    toCSV: async (type) => invokeOperation('exportToCSV', { type }),
  },

  // ========== FILE OPERATIONS ==========
  files: {
    saveFile: async (content, filename) => {
      try {
        await ipcRenderer.invoke('save-file', { content, filename });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    openFile: async (filters) => {
      try {
        const result = await ipcRenderer.invoke('open-file', { filters });
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  },

  // ========== SYSTEM OPERATIONS ==========
  system: {
    onDatabaseReady: (callback) => {
      ipcRenderer.on('database-ready', () => callback());
    },
    onDatabaseError: (callback) => {
      ipcRenderer.on('database-error', (_, error) => callback(error));
    },
    onError: (callback) => {
      ipcRenderer.on('error', (_, error) => callback(error));
    },
  },
});

// Esempio di utilizzo nel React:
/*
// Clienti
const getAllClienti = async () => {
  const result = await window.electronAPI.clienti.getAll();
  if (result.success) {
    setClienti(result.data);
  } else {
    showError(result.error);
  }
};

// Eventi
const createEvento = async (eventoData) => {
  const result = await window.electronAPI.eventi.create(eventoData);
  if (result.success) {
    showSuccess('Evento creato con successo');
    refreshEventi();
  } else {
    showError(result.error);
  }
};

// Import CSV
const importClienti = async (file) => {
  const content = await file.text();
  const result = await window.electronAPI.import.fromCSV('clienti', content);
  if (result.success) {
    showSuccess(`Importati ${result.data.count} clienti`);
    refreshClienti();
  } else {
    showError(result.error);
  }
};
*/
