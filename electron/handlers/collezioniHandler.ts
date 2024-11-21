// electron/handlers/collezioniHandler.ts

import { ipcMain } from 'electron';
import { Database } from 'better-sqlite3';

export function setupCollezioniHandlers(db: Database) {
  ipcMain.handle('collezioni:getAll', async () => {
    return db.prepare('SELECT * FROM Collezioni').all();
  });

  ipcMain.handle('collezioni:getAllWithStats', async () => {
    return db.prepare(`
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
    `).all();
  });

  ipcMain.handle('collezioni:getById', async (_, id: number) => {
    return db.prepare('SELECT * FROM Collezioni WHERE id = ?').get(id);
  });

  ipcMain.handle('collezioni:create', async (_, collezione) => {
    const stmt = db.prepare(`
      INSERT INTO Collezioni (nome, colore, data_inizio, data_fine)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      collezione.nome,
      collezione.colore,
      collezione.data_inizio,
      collezione.data_fine
    );

    return result.lastInsertRowid;
  });

  ipcMain.handle('collezioni:update', async (_, id: number, collezione) => {
    const fields = Object.keys(collezione)
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = db.prepare(`
      UPDATE Collezioni 
      SET ${fields}
      WHERE id = @id
    `);

    const result = stmt.run({ ...collezione, id });
    return result.changes > 0;
  });

  ipcMain.handle('collezioni:delete', async (_, id: number) => {
    const result = db.prepare('DELETE FROM Collezioni WHERE id = ?').run(id);
    return result.changes > 0;
  });

  ipcMain.handle('collezioni:getClienti', async (_, collezioneId: number) => {
    return db.prepare(`
      SELECT 
        c.*,
        cc.tempo_visita
      FROM Clienti c
      JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
      WHERE cc.collezione_id = ?
    `).all(collezioneId);
  });

  ipcMain.handle('collezioni:checkAvailability', async (_, collezioneId: number, start: string, end: string) => {
    const conflitti = db.prepare(`
      SELECT COUNT(*) as count
      FROM Eventi
      WHERE collezione_id = ?
      AND (
        (data_inizio <= ? AND data_fine > ?) OR
        (data_inizio < ? AND data_fine >= ?) OR
        (data_inizio >= ? AND data_fine <= ?)
      )
    `).get(collezioneId, start, start, end, end, start, end);

    return conflitti.count === 0;
  });

  ipcMain.handle('collezioni:importCSV', async (_, csvContent: string) => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').map(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, errors: ['File CSV vuoto o invalido'] };
    }

    const db_transaction = db.transaction((lines) => {
      const insertStmt = db.prepare(`
        INSERT INTO Collezioni (nome, colore, data_inizio, data_fine)
        VALUES (?, ?, ?, ?)
      `);

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim());
        if (values.length !== 4) {
          errors.push(`Riga ${i + 1}: numero di colonne non valido`);
          continue;
        }
        try {
          insertStmt.run(values);
        } catch (error) {
          errors.push(`Riga ${i + 1}: ${error.message}`);
        }
      }
    });

    try {
      db_transaction(lines);
      return { success: true, errors };
    } catch (error) {
      return {
        success: false,
        errors: [...errors, `Errore transazione: ${error.message}`]
      };
    }
  });
}
