const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const log = require('electron-log');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = this.getDatabasePath();
  }

  getDatabasePath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'calendar.db');
  }

  getBackupPath() {
    const userDataPath = app.getPath('userData');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(userDataPath, 'backups', `calendar-${timestamp}.db`);
  }

  async init() {
    try {
      // Ensure backups directory exists
      const backupsDir = path.join(app.getPath('userData'), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      // Initialize database
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      
      // Create tables if they don't exist
      this.db.exec(`
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
      log.error('Error initializing database:', error);
      throw error;
    }
  }

  async backup() {
    try {
      const backupPath = this.getBackupPath();
      await fs.promises.copyFile(this.dbPath, backupPath);
      log.info(`Database backed up to ${backupPath}`);
    } catch (error) {
      log.error('Error backing up database:', error);
      throw error;
    }
  }

  // Platform-specific operations
  getPlatformSpecificPath(basePath) {
    return process.platform === 'darwin' 
      ? path.join(process.env.HOME, 'Library', 'Application Support', basePath)
      : path.join(process.env.APPDATA, basePath);
  }

  // Clean up
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = new DatabaseService();
