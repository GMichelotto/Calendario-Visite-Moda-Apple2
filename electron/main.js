const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const sqlite3 = require('better-sqlite3');
const log = require('electron-log');

let mainWindow;
let db;

// Configurazione del logger
log.transports.file.level = 'info';
log.info('Application Starting...');

async function initializeDatabase() {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'calendar.db');
    
    db = new sqlite3(dbPath);
    db.pragma('journal_mode = WAL');

    // Creazione tabelle
    db.exec(`
      CREATE TABLE IF NOT EXISTS Collezioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome VARCHAR(100) NOT NULL,
        colore VARCHAR(7) NOT NULL,
        data_apertura DATE NOT NULL,
        data_chiusura DATE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Clienti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ragione_sociale VARCHAR(200) NOT NULL,
        indirizzo VARCHAR(200),
        cap VARCHAR(5),
        citta VARCHAR(100),
        provincia VARCHAR(2),
        regione VARCHAR(100),
        telefono VARCHAR(20),
        cellulare VARCHAR(20),
        email VARCHAR(100),
        sito_web VARCHAR(200)
      );

      CREATE TABLE IF NOT EXISTS ClientiCollezioni (
        cliente_id INTEGER,
        collezione_id INTEGER,
        tempo_visita INTEGER NOT NULL,
        priorita INTEGER CHECK(priorita IN (1,2,3)),
        PRIMARY KEY (cliente_id, collezione_id),
        FOREIGN KEY (cliente_id) REFERENCES Clienti(id),
        FOREIGN KEY (collezione_id) REFERENCES Collezioni(id)
      );

      CREATE TABLE IF NOT EXISTS Eventi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER,
        collezione_id INTEGER,
        data_inizio DATETIME NOT NULL,
        data_fine DATETIME NOT NULL,
        FOREIGN KEY (cliente_id) REFERENCES Clienti(id),
        FOREIGN KEY (collezione_id) REFERENCES Collezioni(id)
      );
    `);

    log.info('Database initialized successfully');
  } catch (error) {
    log.error('Database initialization error:', error);
    throw error;
  }
}

// Gestione delle operazioni del database
ipcMain.handle('db-operation', async (event, { operation, ...data }) => {
  try {
    switch (operation) {
      case 'initialize':
        await initializeDatabase();
        return { success: true };

      case 'getClienti':
        return db.prepare('SELECT * FROM Clienti').all();

      case 'getCollezioni':
        return db.prepare('SELECT * FROM Collezioni').all();

      case 'getEventi':
        return db.prepare(`
          SELECT Eventi.*, Clienti.ragione_sociale as cliente, Collezioni.nome as collezione
          FROM Eventi
          JOIN Clienti ON Eventi.cliente_id = Clienti.id
          JOIN Collezioni ON Eventi.collezione_id = Collezioni.id
        `).all();

      case 'addClientiFromCSV':
        const insertCliente = db.prepare(`
          INSERT INTO Clienti (ragione_sociale, indirizzo, cap, citta, provincia, regione, 
            telefono, cellulare, email, sito_web)
          VALUES (@ragione_sociale, @indirizzo, @cap, @citta, @provincia, @regione, 
            @telefono, @cellulare, @email, @sito_web)
        `);

        const insertClienteCollezioni = db.prepare(`
          INSERT INTO ClientiCollezioni (cliente_id, collezione_id, tempo_visita, priorita)
          VALUES (@cliente_id, @collezione_id, @tempo_visita, @priorita)
        `);

        db.transaction((clienti) => {
          for (const cliente of clienti) {
            const result = insertCliente.run(cliente);
            if (cliente.collezioni) {
              for (const collezione of cliente.collezioni) {
                insertClienteCollezioni.run({
                  cliente_id: result.lastInsertRowid,
                  collezione_id: collezione,
                  tempo_visita: 120, // default 2 ore
                  priorita: 2 // priorità media di default
                });
              }
            }
          }
        })(data.data);
        return { success: true };

      case 'addCollezioniFromCSV':
        const insertCollezione = db.prepare(`
          INSERT INTO Collezioni (nome, colore, data_apertura, data_chiusura)
          VALUES (@nome, @colore, @data_apertura, @data_chiusura)
        `);

        db.transaction((collezioni) => {
          for (const collezione of collezioni) {
            insertCollezione.run({
              nome: collezione.Collezioni,
              colore: '#' + Math.floor(Math.random()*16777215).toString(16), // colore casuale
              data_apertura: collezione['Data Inizio'],
              data_chiusura: collezione['Data Fine']
            });
          }
        })(data.data);
        return { success: true };

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    log.error('Database operation error:', error);
    throw error;
  }
});

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

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (db) {
      db.close();
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Gestione errori non catturati
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  if (mainWindow) {
    mainWindow.webContents.send('error', error.message);
  }
});
