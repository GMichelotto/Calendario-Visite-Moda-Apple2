// src/database/migrations/types.ts
export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

// src/database/schema.ts
export const SCHEMA_VERSION_TABLE = `
CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

// src/database/migrations/001_initial_schema.ts
import { Migration } from './types';

export const migration: Migration = {
  version: 1,
  name: 'initial_schema',
  up: `
    -- Clienti table
    CREATE TABLE IF NOT EXISTS Clienti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ragione_sociale TEXT NOT NULL,
      indirizzo TEXT,
      cap TEXT,
      citta TEXT,
      provincia TEXT,
      regione TEXT,
      telefono TEXT,
      cellulare TEXT,
      email TEXT,
      sito_web TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Collezioni table
    CREATE TABLE IF NOT EXISTS Collezioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      colore TEXT NOT NULL DEFAULT '#3B82F6',
      data_inizio DATE NOT NULL,
      data_fine DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ClientiCollezioni table (relazione many-to-many)
    CREATE TABLE IF NOT EXISTS ClientiCollezioni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      collezione_id INTEGER NOT NULL,
      tempo_visita INTEGER DEFAULT 120,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES Clienti(id) ON DELETE CASCADE,
      FOREIGN KEY (collezione_id) REFERENCES Collezioni(id) ON DELETE CASCADE,
      UNIQUE(cliente_id, collezione_id)
    );

    -- Eventi table
    CREATE TABLE IF NOT EXISTS Eventi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      collezione_id INTEGER NOT NULL,
      data_inizio DATETIME NOT NULL,
      data_fine DATETIME NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES Clienti(id) ON DELETE CASCADE,
      FOREIGN KEY (collezione_id) REFERENCES Collezioni(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX idx_clienti_ragione_sociale ON Clienti(ragione_sociale);
    CREATE INDEX idx_collezioni_date ON Collezioni(data_inizio, data_fine);
    CREATE INDEX idx_eventi_date ON Eventi(data_inizio, data_fine);
    CREATE INDEX idx_eventi_cliente ON Eventi(cliente_id);
    CREATE INDEX idx_eventi_collezione ON Eventi(collezione_id);
  `,
  down: `
    DROP TABLE IF EXISTS Eventi;
    DROP TABLE IF EXISTS ClientiCollezioni;
    DROP TABLE IF EXISTS Collezioni;
    DROP TABLE IF EXISTS Clienti;
  `
};

// src/database/migration-runner.ts
import { Database } from 'better-sqlite3';
import { Migration } from './migrations/types';
import { SCHEMA_VERSION_TABLE } from './schema';
import * as migrations from './migrations';

export class MigrationRunner {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  public async initialize(): Promise<void> {
    // Crea la tabella delle versioni se non esiste
    this.db.exec(SCHEMA_VERSION_TABLE);
  }

  public async getCurrentVersion(): Promise<number> {
    const result = this.db.prepare(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    ).get();
    return result ? result.version : 0;
  }

  public async migrate(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const availableMigrations = Object.values(migrations)
      .filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    if (availableMigrations.length === 0) {
      console.log('Il database è aggiornato');
      return;
    }

    this.db.exec('BEGIN TRANSACTION');

    try {
      for (const migration of availableMigrations) {
        console.log(`Applicando migrazione ${migration.version}: ${migration.name}`);
        
        // Esegue la migrazione
        this.db.exec(migration.up);

        // Registra la versione
        this.db.prepare(
          'INSERT INTO schema_version (version, name) VALUES (?, ?)'
        ).run(migration.version, migration.name);
      }

      this.db.exec('COMMIT');
      console.log('Migrazioni completate con successo');
    } catch (error) {
      this.db.exec('ROLLBACK');
      console.error('Errore durante le migrazioni:', error);
      throw error;
    }
  }

  public async rollback(targetVersion?: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    if (currentVersion === 0) {
      console.log('Nessuna migrazione da annullare');
      return;
    }

    const targetVer = targetVersion || currentVersion - 1;
    const migrationsToRollback = Object.values(migrations)
      .filter(m => m.version > targetVer && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version);

    this.db.exec('BEGIN TRANSACTION');

    try {
      for (const migration of migrationsToRollback) {
        console.log(`Annullando migrazione ${migration.version}: ${migration.name}`);
        
        // Esegue il rollback
        this.db.exec(migration.down);

        // Rimuove la versione
        this.db.prepare(
          'DELETE FROM schema_version WHERE version = ?'
        ).run(migration.version);
      }

      this.db.exec('COMMIT');
      console.log('Rollback completato con successo');
    } catch (error) {
      this.db.exec('ROLLBACK');
      console.error('Errore durante il rollback:', error);
      throw error;
    }
  }
}
