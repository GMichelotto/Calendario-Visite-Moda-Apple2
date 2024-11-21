// electron/handlers/clientiHandler.ts

import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';

interface Cliente {
  id?: number;
  ragione_sociale: string;
  collezioni?: string[];
  [key: string]: any;
}

interface ClienteDb {
  id: number;
  collezioni: string;
  [key: string]: any;
}

export function setupClientiHandlers(db: Database) {
  ipcMain.handle('clienti:getAll', async () => {
    return db.prepare('SELECT * FROM Clienti').all() as Cliente[];
  });

  ipcMain.handle('clienti:getAllWithCollezioni', async () => {
    const result = db.prepare(`
      SELECT 
        c.*,
        GROUP_CONCAT(col.nome) as collezioni
      FROM Clienti c
      LEFT JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
      LEFT JOIN Collezioni col ON cc.collezione_id = col.id
      GROUP BY c.id
    `).all() as ClienteDb[];

    return result.map(cliente => ({
      ...cliente,
      collezioni: cliente.collezioni ? cliente.collezioni.split(',') : []
    }));
  });

  // ... resto del codice rimane uguale ma con i tipi corretti

  ipcMain.handle('clienti:importCSV', async (_, csvContent: string) => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').map(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, errors: ['File CSV vuoto o invalido'] };
    }

    const db_transaction = db.transaction((lines: string[]) => {
      const insertStmt = db.prepare(`
        INSERT INTO Clienti (
          ragione_sociale, indirizzo, cap, citta, provincia, 
          regione, telefono, cellulare, email, sito_web
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map((v: string) => v.trim());
        if (values.length !== 10) {
          errors.push(`Riga ${i + 1}: numero di colonne non valido`);
          continue;
        }
        try {
          insertStmt.run(values);
        } catch (error) {
          errors.push(`Riga ${i + 1}: ${(error as Error).message}`);
        }
      }
    });

    try {
      db_transaction(lines);
      return { success: true, errors };
    } catch (error) {
      return { 
        success: false, 
        errors: [...errors, `Errore transazione: ${(error as Error).message}`] 
      };
    }
  });
}
