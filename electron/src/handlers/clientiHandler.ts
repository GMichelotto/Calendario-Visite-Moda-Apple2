// electron/src/handlers/clientiHandler.ts

import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';

interface IpcMainInvokeEvent {}

interface Cliente {
  id?: number;
  ragione_sociale: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  regione?: string;
  telefono?: string;
  cellulare?: string;
  email?: string;
  sito_web?: string;
  note?: string;
  collezioni?: string[];
}

interface ClienteDb extends Omit<Cliente, 'collezioni'> {
  id: number;
  collezioni: string;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
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

function validateCliente(cliente: Omit<Cliente, 'id'>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validazione ragione sociale
  if (!cliente.ragione_sociale || cliente.ragione_sociale.trim().length === 0) {
    errors.push('La ragione sociale è obbligatoria');
  }

  // Validazione email
  if (cliente.email && !cliente.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('Formato email non valido');
  }

  // Validazione CAP
  if (cliente.cap && !cliente.cap.match(/^\d{5}$/)) {
    errors.push('Formato CAP non valido (5 cifre)');
  }

  // Validazione telefono
  if (cliente.telefono && !cliente.telefono.match(/^[\d\s+\-()]+$/)) {
    errors.push('Formato telefono non valido');
  }

  // Validazione cellulare
  if (cliente.cellulare && !cliente.cellulare.match(/^[\d\s+\-()]+$/)) {
    errors.push('Formato cellulare non valido');
  }

  // Validazione sito web
  if (cliente.sito_web && !cliente.sito_web.match(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)) {
    errors.push('Formato sito web non valido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
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
      const validation = validateCliente(clienteData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validazione fallita',
          errors: validation.errors
        };
      }

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

      const clienteToValidate = {
        ...currentCliente.data,
        ...clienteData
      };

      const validation = validateCliente(clienteToValidate as Omit<Cliente, 'id'>);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validazione fallita',
          errors: validation.errors
        };
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
}
