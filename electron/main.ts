// electron/main.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import BetterSqlite3, { Database } from 'better-sqlite3';
import path from 'path';
import isDev from 'electron-is-dev';
import electronLog from 'electron-log';
import { setupClientiHandlers } from './handlers/clientiHandler';
import { setupCollezioniHandlers } from './handlers/collezioniHandler';
import { setupEventiHandlers } from './handlers/eventiHandler';
import { MigrationRunner } from '../src/database/migration-runner';

let mainWindow: BrowserWindow | null = null;
let db: Database | null = null;

// Configura il logger
electronLog.initialize({ preload: true });
Object.assign(console, electronLog.functions);

async function initDatabase() {
  try {
    const dbPath = isDev 
      ? path.join(__dirname, '../database.db')
      : path.join(app.getPath('userData'), 'database.db');

    console.log(`Inizializzazione database: ${dbPath}`);

    db = new BetterSqlite3(dbPath, {
      verbose: isDev ? console.log : undefined
    });

    // Abilita le foreign keys
    db.pragma('foreign_keys = ON');

    // Inizializza e esegue le migrazioni
    const migrationRunner = new MigrationRunner(db);
    await migrationRunner.initialize();
    
    const currentVersion = await migrationRunner.getCurrentVersion();
    console.log(`Versione corrente del database: ${currentVersion}`);
    
    await migrationRunner.migrate();
    console.log('Migrazioni del database completate');

    // Inizializza gli handler dopo le migrazioni
    setupDatabaseHandlers();

    return true;
  } catch (error) {
    console.error('Errore durante l\'inizializzazione del database:', error);
    throw error;
  }
}

function setupDatabaseHandlers() {
  if (!db) {
    throw new Error('Database non inizializzato');
  }

  setupClientiHandlers(db);
  setupCollezioniHandlers(db);
  setupEventiHandlers(db);

  // Handler per le operazioni di migrazione
  ipcMain.handle('database:getCurrentVersion', async () => {
    if (!db) return 0;
    const migrationRunner = new MigrationRunner(db);
    return await migrationRunner.getCurrentVersion();
  });

  ipcMain.handle('database:migrate', async () => {
    if (!db) throw new Error('Database non inizializzato');
    const migrationRunner = new MigrationRunner(db);
    await migrationRunner.migrate();
    return await migrationRunner.getCurrentVersion();
  });

  ipcMain.handle('database:rollback', async (_, targetVersion?: number) => {
    if (!db) throw new Error('Database non inizializzato');
    const migrationRunner = new MigrationRunner(db);
    await migrationRunner.rollback(targetVersion);
    return await migrationRunner.getCurrentVersion();
  });
}

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
  });
}

// Inizializzazione dell'app
app.on('ready', async () => {
  try {
    await initDatabase();
    createWindow();
    console.log('Applicazione inizializzata con successo');
  } catch (error) {
    console.error('Errore durante l\'inizializzazione dell\'applicazione:', error);
    app.quit();
  }
});

// Gestione chiusura app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  if (db) {
    console.log('Chiusura connessione database');
    db.close();
    db = null;
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Gestione errori non catturati
process.on('uncaughtException', (error) => {
  console.error('Errore non catturato:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise non gestita:', reason);
});

// Chiusura pulita
process.on('exit', () => {
  if (db) {
    console.log('Chiusura connessione database');
    db.close();
  }
});
