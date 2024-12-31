// electron/handlers/collezioniHandler.ts

import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';

interface Collezione {
  id?: number;
  nome: string;
  colore: string;
  data_inizio: string;
  data_fine: string;
  [key: string]: any;
}

interface CollezioneStats extends Collezione {
  clienti_associati: number;
  appuntamenti_totali: number;
  disponibilita: number;
}

export function setupCollezioniHandlers(db: Database) {
  ipcMain.handle('collezioni:getAllWithStats', async () => {
    const result = db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT cc.cliente_id) as clienti_associati,
        COUNT(DISTINCT e.id) as appuntamenti_totali,
        ROUND(
          (1 - CAST(COUNT(DISTINCT e.id) AS FLOAT) / 
          (CAST(
            (julianday(c.data_fine) - julianday(c.data_inizio) + 1) * 8 
          AS INTEGER))) * 100
        ) as disponibilita
      FROM Collezioni c
      LEFT JOIN ClientiCollezioni cc ON c.id = cc.collezione_id
      LEFT JOIN Eventi e ON c.id = e.collezione_id
      GROUP BY c.id
    `).all() as CollezioneStats[];

    return result;
  });

  ipcMain.handle('collezioni:importCSV', async (_, csvContent: string) => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').map((line: string) => line.trim());
    
    if (lines.length < 2) {
      return { success: false, errors: ['File CSV vuoto o invalido'] };
    }

    const db_transaction = db.transaction((lines: string[]) => {
      const insertStmt = db.prepare(`
        INSERT INTO Collezioni (nome, colore, data_inizio, data_fine)
        VALUES (?, ?, ?, ?)
      `);

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map((v: string) => v.trim());
        if (values.length !== 4) {
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
