// electron/handlers/eventiHandler.ts

import { ipcMain } from 'electron';
import { Database } from 'better-sqlite3';
import moment from 'moment';

export function setupEventiHandlers(db: Database) {
  ipcMain.handle('eventi:getAll', async () => {
    return db.prepare(`
      SELECT 
        e.*,
        c.ragione_sociale as cliente_nome,
        col.nome as collezione_nome,
        col.colore as collezione_colore
      FROM Eventi e
      JOIN Clienti c ON e.cliente_id = c.id
      JOIN Collezioni col ON e.collezione_id = col.id
    `).all();
  });

  ipcMain.handle('eventi:getByDateRange', async (_, start: string, end: string) => {
    return db.prepare(`
      SELECT 
        e.*,
        c.ragione_sociale as cliente_nome,
        col.nome as collezione_nome,
        col.colore as collezione_colore
      FROM Eventi e
      JOIN Clienti c ON e.cliente_id = c.id
      JOIN Collezioni col ON e.collezione_id = col.id
      WHERE e.data_inizio >= ? AND e.data_fine <= ?
    `).all(start, end);
  });

  ipcMain.handle('eventi:create', async (_, evento) => {
    const validation = validateEvent(db, evento);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const stmt = db.prepare(`
      INSERT INTO Eventi (cliente_id, collezione_id, data_inizio, data_fine, note)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      evento.cliente_id,
      evento.collezione_id,
      evento.data_inizio,
      evento.data_fine,
      evento.note || null
    );

    return result.lastInsertRowid;
  });

  ipcMain.handle('eventi:update', async (_, id: number, evento) => {
    const validation = validateEvent(db, { ...evento, id });
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const fields = Object.keys(evento)
      .map(key => `${key} = @${key}`)
      .join(', ');

    const stmt = db.prepare(`
      UPDATE Eventi 
      SET ${fields}
      WHERE id = @id
    `);

    const result = stmt.run({ ...evento, id });
    return result.changes > 0;
  });

  ipcMain.handle('eventi:delete', async (_, id: number) => {
    const result = db.prepare('DELETE FROM Eventi WHERE id = ?').run(id);
    return result.changes > 0;
  });

  ipcMain.handle('eventi:validate', async (_, evento) => {
    return validateEvent(db, evento);
  });

  ipcMain.handle('eventi:getByCliente', async (_, clienteId: number) => {
    return db.prepare(`
      SELECT 
        e.*,
        c.ragione_sociale as cliente_nome,
        col.nome as collezione_nome,
        col.colore as collezione_colore
      FROM Eventi e
      JOIN Clienti c ON e.cliente_id = c.id
      JOIN Collezioni col ON e.collezione_id = col.id
      WHERE e.cliente_id = ?
      ORDER BY e.data_inizio
    `).all(clienteId);
  });

  ipcMain.handle('eventi:getByCollezione', async (_, collezioneId: number) => {
    return db.prepare(`
      SELECT 
        e.*,
        c.ragione_sociale as cliente_nome,
        col.nome as collezione_nome,
        col.colore as collezione_colore
      FROM Eventi e
      JOIN Clienti c ON e.cliente_id = c.id
      JOIN Collezioni col ON e.collezione_id = col.id
      WHERE e.collezione_id = ?
      ORDER BY e.data_inizio
    `).all(collezioneId);
  });
}

function validateEvent(db: Database, evento: any) {
  const errors: string[] = [];

  // Verifica orari lavorativi
  const startTime = moment(evento.data_inizio);
  const endTime = moment(evento.data_fine);
  
  if (startTime.hours() < 9 || endTime.hours() >= 18) {
    errors.push('Gli appuntamenti devono essere tra le 9:00 e le 18:00');
  }

  // Verifica giorni lavorativi
  if (startTime.day() === 0 || startTime.day() === 6) {
    errors.push('Gli appuntamenti non possono essere nei weekend');
  }

  // Verifica sovrapposizioni
  const overlaps = db.prepare(`
    SELECT COUNT(*) as count
    FROM Eventi
    WHERE (data_inizio < ? AND data_fine > ?)
    OR (data_inizio < ? AND data_fine > ?)
    OR (data_inizio > ? AND data_fine < ?)
    ${evento.id ? 'AND id != ?' : ''}
  `).get(
    evento.data_fine,
    evento.data_inizio,
    evento.data_fine,
    evento.data_inizio,
    evento.data_inizio,
    evento.data_fine,
    evento.id
  );

  if (overlaps.count > 0) {
    errors.push('L\'appuntamento si sovrappone con altri esistenti');
  }

  // Verifica periodo collezione
  const collezione = db.prepare(`
    SELECT data_inizio, data_fine
    FROM Collezioni
    WHERE id = ?
  `).get(evento.collezione_id);

  if (collezione) {
    const collectionStart = moment(collezione.data_inizio);
    const collectionEnd = moment(collezione.data_fine);

    if (startTime.isBefore(collectionStart) || endTime.isAfter(collectionEnd)) {
      errors.push('L\'appuntamento deve essere nel periodo della collezione');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
