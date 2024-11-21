// electron/handlers/clientiHandler.ts

import { ipcMain } from 'electron';
import { Database } from 'better-sqlite3';

export function setupClientiHandlers(db: Database) {
  ipcMain.handle('clienti:getAll', async () => {
    return db.prepare('SELECT * FROM Clienti').all();
  });

  ipcMain.handle('clienti:getAllWithCollezioni', async () => {
    return db.prepare(`
      SELECT 
        c.*,
        GROUP_CONCAT(col.nome) as collezioni
      FROM Clienti c
      LEFT JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
      LEFT JOIN Collezioni col ON cc.collezione_id = col.id
      GROUP BY c.id
    `).all().map(cliente => ({
      ...cliente,
      collezioni: cliente.collezioni ? cliente.collezioni.split(',') : []
    }));
  });

  ipcMain.handle('clienti:getById', async (_, id: number) => {
    return db.prepare('SELECT * FROM Clienti WHERE id = ?').get(id);
  });

  ipcMain.handle('clienti:create', async (_, cliente) => {
    const stmt = db.prepare(`
      INSERT INTO Clienti (
        ragione_sociale, indirizzo, cap, citta, provincia, 
        regione, telefono, cellulare, email, sito_web
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cliente.ragione_sociale,
      cliente.indirizzo,
      cliente.cap,
      cliente.citta,
      cliente.provincia,
      cliente.regione,
      cliente.telefono,
      cliente.cellulare,
      cliente.email,
      cliente.sito_web
    );

    return result.lastInsertRowid;
  });

  ipcMain.handle('clienti:update', async (_, id: number, cliente) => {
    const fields = Object.keys(cliente)
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = db.prepare(`
      UPDATE Clienti 
      SET ${fields}
      WHERE id = @id
    `);

    const result = stmt.run({ ...cliente, id });
    return result.changes > 0;
  });

  ipcMain.handle('clienti:delete', async (_, id: number) => {
    const result = db.prepare('DELETE FROM Clienti WHERE id = ?').run(id);
    return result.changes > 0;
  });

  ipcMain.handle('clienti:assignCollezione', async (_, clienteId: number, collezioneId: number, tempoVisita: number) => {
    const stmt = db.prepare(`
      INSERT INTO ClientiCollezioni (cliente_id, collezione_id, tempo_visita)
      VALUES (?, ?, ?)
    `);

    try {
      stmt.run(clienteId, collezioneId, tempoVisita);
      return true;
    } catch (error) {
      console.error('Errore assegnazione collezione:', error);
      return false;
    }
  });

  ipcMain.handle('clienti:removeCollezione', async (_, clienteId: number, collezioneId: number) => {
    const result = db.prepare(`
      DELETE FROM ClientiCollezioni 
      WHERE cliente_id = ? AND collezione_id = ?
    `).run(clienteId, collezioneId);
    
    return result.changes > 0;
  });

  ipcMain.handle('clienti:importCSV', async (_, csvContent: string) => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').map(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, errors: ['File CSV vuoto o invalido'] };
    }

    const db_transaction = db.transaction((lines) => {
      const insertStmt = db.prepare(`
        INSERT INTO Clienti (
          ragione_sociale, indirizzo, cap, citta, provincia, 
          regione, telefono, cellulare, email, sito_web
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim());
        if (values.length !== 10) {
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
