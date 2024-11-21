// electron/main.ts

import { app, BrowserWindow } from 'electron';
import { Database } from 'better-sqlite3';
import path from 'path';
import isDev from 'electron-is-dev';
import { setupClientiHandlers } from './handlers/clientiHandler';
import { setupCollezioniHandlers } from './handlers/collezioniHandler';
import { setupEventiHandlers } from './handlers/eventiHandler';

let mainWindow: BrowserWindow | null = null;
let db: Database | null = null;

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

function initDatabase() {
  const dbPath = isDev 
    ? path.join(__dirname, '../database.db')
    : path.join(app.getPath('userData'), 'database.db');

  db = new Database(dbPath);

  // Abilita le foreign keys
  db.pragma('foreign_keys = ON');

  // Setup handlers
  setupClientiHandlers(db);
  setupCollezioniHandlers(db);
  setupEventiHandlers(db);
}

app.on('ready', () => {
  initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  if (db) {
    db.close();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

process.on('exit', () => {
  if (db) {
    db.close();
  }
});
