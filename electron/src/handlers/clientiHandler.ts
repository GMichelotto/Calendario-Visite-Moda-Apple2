import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';
import { 
  Cliente, 
  APIResponse, 
  ImportResult 
} from '../../types';  // Percorso relativo diretto alla cartella types di electron

interface IpcMainInvokeEvent {}

interface ClienteDb extends Omit<Cliente, 'collezioni'> {
  id: number;
  collezioni: string;
}

function getClientById(db: Database, id: number): APIResponse<Cliente> {
  try {
    const cliente = db.prepare(`
      SELECT 
        c.*,
        GROUP_CONCAT(col.nome) as collezioni
      FROM Clienti c
      LEFT JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
      LEFT JOIN Collezioni col ON cc.collezione_id = col.id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(id) as ClienteDb | undefined;

    if (!cliente) {
      return { success: false, error: 'Cliente non trovato' };
    }

    return {
      success: true,
      data: {
        ...cliente,
        collezioni: cliente.collezioni ? cliente.collezioni.split(',') : []
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Errore nel recupero del cliente: ${(error as Error).message}`
    };
  }
}

export function setupClientiHandlers(db: Database): void {
  // GET ALL
  ipcMain.handle('clienti:getAll', (event: IpcMainInvokeEvent) => {
    try {
      const result = db.prepare('SELECT * FROM Clienti').all() as Cliente[];
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero dei clienti: ${(error as Error).message}`
      };
    }
  });

  // GET ALL WITH COLLECTIONS
  ipcMain.handle('clienti:getAllWithCollezioni', (event: IpcMainInvokeEvent) => {
    try {
      const result = db.prepare(`
        SELECT 
          c.*,
          GROUP_CONCAT(col.nome) as collezioni
        FROM Clienti c
        LEFT JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
        LEFT JOIN Collezioni col ON cc.collezione_id = col.id
        GROUP BY c.id
      `).all() as ClienteDb[];

      const data = result.map(cliente => ({
        ...cliente,
        collezioni: cliente.collezioni ? cliente.collezioni.split(',') : []
      }));

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero dei clienti con collezioni: ${(error as Error).message}`
      };
    }
  });

  // GET BY ID
  ipcMain.handle('clienti:getById', (event: IpcMainInvokeEvent, id: number) => {
    return getClientById(db, id);
  });

  // CREATE
  ipcMain.handle('clienti:create', (event: IpcMainInvokeEvent, clienteData: Omit<Cliente, 'id'>) => {
    try {
      const result = db.prepare(`
        INSERT INTO Clienti (
          ragione_sociale, indirizzo, cap, citta, provincia, 
          regione, telefono, cellulare, email, sito_web, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run([
        clienteData.ragione_sociale,
        clienteData.indirizzo || null,
        clienteData.cap || null,
        clienteData.citta || null,
        clienteData.provincia || null,
        clienteData.regione || null,
        clienteData.telefono || null,
        clienteData.cellulare || null,
        clienteData.email || null,
        clienteData.sito_web || null,
        clienteData.note || null
      ]);

      if (result.changes > 0) {
        return getClientById(db, result.lastInsertRowid as number);
      }

      return {
        success: false,
        error: 'Nessuna riga inserita'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nella creazione del cliente: ${(error as Error).message}`
      };
    }
  });

  // UPDATE
  ipcMain.handle('clienti:update', (event: IpcMainInvokeEvent, id: number, clienteData: Partial<Cliente>) => {
    try {
      const currentCliente = getClientById(db, id);
      if (!currentCliente.success) {
        return currentCliente;
      }

      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(clienteData)) {
        if (key !== 'id' && key !== 'collezioni') {
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
        UPDATE Clienti 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(updateValues);

      if (result.changes > 0) {
        return getClientById(db, id);
      }

      return {
        success: false,
        error: 'Cliente non trovato o nessuna modifica effettuata'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'aggiornamento del cliente: ${(error as Error).message}`
      };
    }
  });

  // DELETE
  ipcMain.handle('clienti:delete', (event: IpcMainInvokeEvent, id: number) => {
    try {
      db.prepare('DELETE FROM ClientiCollezioni WHERE cliente_id = ?').run(id);
      const result = db.prepare('DELETE FROM Clienti WHERE id = ?').run(id);

      if (result.changes > 0) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Cliente non trovato'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'eliminazione del cliente: ${(error as Error).message}`
      };
    }
  });

  // IMPORT CSV
  ipcMain.handle('clienti:importCSV', (event: IpcMainInvokeEvent, csvContent: string) => {
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
        const values = lines[i].split(';').map(v => v.trim());
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

  // ASSIGN COLLECTION
  ipcMain.handle('clienti:assignCollezione', (event: IpcMainInvokeEvent, clienteId: number, collezioneId: number) => {
    try {
      const result = db.prepare(`
        INSERT INTO ClientiCollezioni (cliente_id, collezione_id)
        VALUES (?, ?)
      `).run(clienteId, collezioneId);

      return { success: result.changes > 0 };
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'assegnazione della collezione: ${(error as Error).message}`
      };
    }
  });

  // REMOVE COLLECTION
  ipcMain.handle('clienti:removeCollezione', (event: IpcMainInvokeEvent, clienteId: number, collezioneId: number) => {
    try {
      const result = db.prepare(`
        DELETE FROM ClientiCollezioni 
        WHERE cliente_id = ? AND collezione_id = ?
      `).run(clienteId, collezioneId);

      return { success: result.changes > 0 };
    } catch (error) {
      return {
        success: false,
        error: `Errore nella rimozione della collezione: ${(error as Error).message}`
      };
    }
  });
}
