// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const log = require('electron-log');
const DatabaseService = require('./services/database.service');

let mainWindow;

// Configurazione logger
log.transports.file.level = 'info';
log.info('Application Starting...');

// Gestione IPC per operazioni database
ipcMain.handle('db-operation', async (event, { operation, data }) => {
  try {
    log.info(`Executing database operation: ${operation}`, data);
    
    switch (operation) {
      // ========== CLIENTI OPERATIONS ==========
      case 'getClienti':
        return await DatabaseService.getClienti();

      case 'getClienteById':
        return await DatabaseService.getClienteById(data.id);

      case 'createCliente':
        return await DatabaseService.createCliente(data);

      case 'updateCliente':
        return await DatabaseService.updateCliente(data.id, data.cliente);

      case 'deleteCliente':
        return await DatabaseService.deleteCliente(data.id);

      // ========== COLLEZIONI OPERATIONS ==========
      case 'getCollezioni':
        return await DatabaseService.getCollezioni();

      case 'getCollezioneById':
        return await DatabaseService.getCollezioneById(data.id);

      case 'createCollezione':
        return await DatabaseService.createCollezione(data);

      case 'updateCollezione':
        return await DatabaseService.updateCollezione(data.id, data.collezione);

      case 'deleteCollezione':
        return await DatabaseService.deleteCollezione(data.id);

      // ========== EVENTI OPERATIONS ==========
      case 'getEventi':
        return await DatabaseService.getEventi();

      case 'getEventoById':
        return await DatabaseService.getEventoById(data.id);

      case 'createEvento':
        // Validazione evento prima della creazione
        const hasOverlap = await DatabaseService.validateEventOverlap(
          data.data_inizio,
          data.data_fine
        );
        
        if (hasOverlap) {
          throw new Error('Esiste già un evento programmato in questo periodo');
        }

        const isValidDate = await DatabaseService.validateCollezioneDate(
          data.collezione_id,
          data.data_inizio
        );

        if (!isValidDate) {
          throw new Error('La data non rientra nel periodo della collezione');
        }

        return await DatabaseService.createEvento(data);

      case 'updateEvento':
        // Validazione evento prima dell'aggiornamento
        const hasOverlapUpdate = await DatabaseService.validateEventOverlap(
          data.evento.data_inizio,
          data.evento.data_fine,
          data.id
        );
        
        if (hasOverlapUpdate) {
          throw new Error('Esiste già un evento programmato in questo periodo');
        }

        const isValidDateUpdate = await DatabaseService.validateCollezioneDate(
          data.evento.collezione_id,
          data.evento.data_inizio
        );

        if (!isValidDateUpdate) {
          throw new Error('La data non rientra nel periodo della collezione');
        }

        return await DatabaseService.updateEvento(data.id, data.evento);

      case 'deleteEvento':
        return await DatabaseService.deleteEvento(data.id);

      // ========== IMPORT/EXPORT OPERATIONS ==========
      case 'importFromCSV':
        return await handleCSVImport(data.type, data.content);

      case 'exportToCSV':
        return await handleCSVExport(data.type);

      // ========== UTILITY OPERATIONS ==========
      case 'validateEventTiming':
        const overlap = await DatabaseService.validateEventOverlap(
          data.start,
          data.end,
          data.excludeId
        );
        
        const validDate = await DatabaseService.validateCollezioneDate(
          data.collezione_id,
          data.start
        );

        return {
          hasOverlap: overlap,
          isValidDate: validDate,
          isValid: !overlap && validDate
        };

      default:
        throw new Error(`Operazione non supportata: ${operation}`);
    }
  } catch (error) {
    log.error(`Error in database operation ${operation}:`, error);
    throw error;
  }
});

// Gestione import CSV
async function handleCSVImport(type, content) {
  try {
    switch (type) {
      case 'clienti':
        const clientiData = parseCSV(content);
        for (const cliente of clientiData) {
          await DatabaseService.createCliente(cliente);
        }
        return { success: true, count: clientiData.length };

      case 'collezioni':
        const collezioniData = parseCSV(content);
        for (const collezione of collezioniData) {
          await DatabaseService.createCollezione(collezione);
        }
        return { success: true, count: collezioniData.length };

      default:
        throw new Error(`Tipo di import non supportato: ${type}`);
    }
  } catch (error) {
    log.error(`Error importing ${type}:`, error);
    throw error;
  }
}

// Gestione export CSV
async function handleCSVExport(type) {
  try {
    switch (type) {
      case 'clienti':
        const clienti = await DatabaseService.getClienti();
        return convertToCSV(clienti);

      case 'collezioni':
        const collezioni = await DatabaseService.getCollezioni();
        return convertToCSV(collezioni);

      case 'eventi':
        const eventi = await DatabaseService.getEventi();
        return convertToCSV(eventi);

      default:
        throw new Error(`Tipo di export non supportato: ${type}`);
    }
  } catch (error) {
    log.error(`Error exporting ${type}:`, error);
    throw error;
  }
}

// Utility per parsing CSV
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(';');
  
  return lines.slice(1).map(line => {
    const values = line.split(';');
    const entry = {};
    
    headers.forEach((header, index) => {
      entry[header.trim()] = values[index]?.trim() || '';
    });
    
    return entry;
  });
}

// Utility per conversione in CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvLines = [
    headers.join(';'),
    ...data.map(item => headers.map(header => item[header] || '').join(';'))
  ];
  
  return csvLines.join('\n');
}

// Window management
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Inizializzazione database
  DatabaseService.init()
    .then(() => {
      log.info('Database initialized successfully');
      mainWindow.webContents.send('database-ready', true);
    })
    .catch(error => {
      log.error('Database initialization failed:', error);
      mainWindow.webContents.send('database-error', error.message);
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
    DatabaseService.close();
  });
}

// App lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  DatabaseService.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  if (mainWindow) {
    mainWindow.webContents.send('error', error.message);
  }
});
