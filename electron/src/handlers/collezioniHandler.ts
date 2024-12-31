import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';
import { 
  Collezione, 
  APIResponse, 
  ImportResult, 
  DashboardStats, 
  SlotAvailability 
} from '../../../types';

interface IpcMainInvokeEvent {}

interface CollezioneStats extends Collezione {
  clienti_associati: number;
  appuntamenti_totali: number;
  disponibilita: number;
}

interface CollezioneWithMetrics {
  id: number;
  nome: string;
  colore: string;
  data_inizio: string;
  data_fine: string;
  note?: string;
  clienti_associati: number;
  appuntamenti_totali: number;
  disponibilita: number;
}

function getCollezioneById(db: Database, id: number): APIResponse<Collezione> {
  try {
    const result = db.prepare(`
      SELECT *
      FROM Collezioni
      WHERE id = ?
    `).get(id) as Collezione | undefined;

    if (!result) {
      return { success: false, error: 'Collezione non trovata' };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: `Errore nel recupero della collezione: ${(error as Error).message}`
    };
  }
}

export function setupCollezioniHandlers(db: Database): void {
  // GET ALL
  ipcMain.handle('collezioni:getAll', (event: IpcMainInvokeEvent) => {
    try {
      const result = db.prepare('SELECT * FROM Collezioni').all() as Collezione[];
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero delle collezioni: ${(error as Error).message}`
      };
    }
  });

  // GET ALL WITH STATS
  ipcMain.handle('collezioni:getAllWithStats', (event: IpcMainInvokeEvent) => {
    try {
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
      `).all() as CollezioneWithMetrics[];

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero delle statistiche delle collezioni: ${(error as Error).message}`
      };
    }
  });

  // GET BY ID
  ipcMain.handle('collezioni:getById', (event: IpcMainInvokeEvent, id: number) => {
    return getCollezioneById(db, id);
  });

  // CREATE
  ipcMain.handle('collezioni:create', (event: IpcMainInvokeEvent, collezioneData: Omit<Collezione, 'id'>) => {
    try {
      const result = db.prepare(`
        INSERT INTO Collezioni (
          nome, colore, data_inizio, data_fine, note
        ) VALUES (?, ?, ?, ?, ?)
      `).run([
        collezioneData.nome,
        collezioneData.colore,
        collezioneData.data_inizio,
        collezioneData.data_fine,
        collezioneData.note || null
      ]);

      if (result.changes > 0) {
        return getCollezioneById(db, result.lastInsertRowid as number);
      }

      return {
        success: false,
        error: 'Nessuna riga inserita'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nella creazione della collezione: ${(error as Error).message}`
      };
    }
  });

  // UPDATE
  ipcMain.handle('collezioni:update', (event: IpcMainInvokeEvent, id: number, collezioneData: Partial<Collezione>) => {
    try {
      const currentCollezione = getCollezioneById(db, id);
      if (!currentCollezione.success) {
        return currentCollezione;
      }

      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(collezioneData)) {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      if (updateFields.length === 0) {
        return {
          success: false,
          error: 'Nessun campo da aggiornare'
        };
      }

      updateValues.push(id);
      
      const result = db.prepare(`
        UPDATE Collezioni 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(updateValues);

      if (result.changes > 0) {
        return getCollezioneById(db, id);
      }

      return {
        success: false,
        error: 'Collezione non trovata o nessuna modifica effettuata'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'aggiornamento della collezione: ${(error as Error).message}`
      };
    }
  });

  // DELETE
  ipcMain.handle('collezioni:delete', (event: IpcMainInvokeEvent, id: number) => {
    try {
      db.prepare('DELETE FROM ClientiCollezioni WHERE collezione_id = ?').run(id);
      db.prepare('DELETE FROM Eventi WHERE collezione_id = ?').run(id);
      const result = db.prepare('DELETE FROM Collezioni WHERE id = ?').run(id);

      if (result.changes > 0) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Collezione non trovata'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'eliminazione della collezione: ${(error as Error).message}`
      };
    }
  });

  // CHECK AVAILABILITY
  ipcMain.handle('collezioni:checkAvailability', 
    (event: IpcMainInvokeEvent, id: number, startDate: string, endDate: string) => {
    try {
      const conflicts = db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE e.collezione_id = ?
        AND (
          (e.data_inizio <= ? AND e.data_fine >= ?)
          OR (e.data_inizio <= ? AND e.data_fine >= ?)
          OR (? <= e.data_fine AND ? >= e.data_inizio)
        )
      `).all(id, endDate, startDate, endDate, startDate, startDate, endDate);

      const availability: SlotAvailability[] = [{
        start: new Date(startDate),
        end: new Date(endDate),
        isAvailable: conflicts.length === 0,
        conflicts: conflicts.map(conflict => ({
          clienteId: (conflict as any).cliente_id,
          clienteName: (conflict as any).cliente_nome,
          collezioneId: (conflict as any).collezione_id,
          collezioneName: (conflict as any).collezione_nome
        }))
      }];

      return { success: true, data: availability };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel controllo della disponibilità: ${(error as Error).message}`
      };
    }
  });

  // GET DASHBOARD STATS
  ipcMain.handle('collezioni:getDashboardStats', (event: IpcMainInvokeEvent, id: number) => {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT cc.cliente_id) as totalClienti,
          COUNT(DISTINCT e.id) as totaleAppuntamenti,
          ROUND(
            (1 - CAST(COUNT(DISTINCT e.id) AS FLOAT) / 
            (CAST(
              (julianday(c.data_fine) - julianday(c.data_inizio) + 1) * 8 
            AS INTEGER))) * 100
          ) as disponibilita,
          (CAST(
            (julianday(c.data_fine) - julianday(c.data_inizio) + 1) * 8 
          AS INTEGER) - COUNT(DISTINCT e.id)) as slotDisponibili
        FROM Collezioni c
        LEFT JOIN ClientiCollezioni cc ON c.id = cc.collezione_id
        LEFT JOIN Eventi e ON c.id = e.collezione_id
        WHERE c.id = ?
        GROUP BY c.id
      `).get(id) as DashboardStats;

      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero delle statistiche: ${(error as Error).message}`
      };
    }
  });

  // IMPORT CSV
  ipcMain.handle('collezioni:importCSV', (event: IpcMainInvokeEvent, csvContent: string) => {
    const errors: string[] = [];
    const lines = csvContent.split('\n').map(line => line.trim());
    
    if (lines.length < 2) {
      return { success: false, errors: ['File CSV vuoto o invalido'] };
    }

    const db_transaction = db.transaction((lines: string[]) => {
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
          errors.push(`Riga ${i + 1}: ${(error as Error).message}`);
        }
      }
    });

    try {
      db_transaction(lines);
      return { 
        success: true, 
        errors: errors.length > 0 ? errors : undefined 
      };
    } catch (error) {
      return {
        success: false,
        errors: [...errors, `Errore transazione: ${(error as Error).message}`]
      };
    }
  });
}
