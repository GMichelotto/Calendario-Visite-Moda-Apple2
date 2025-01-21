import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';
import moment from 'moment';
import { 
  Evento,
  APIResponse,
  ValidationResponse,
  EventValidationRequest,
  Collezione
} from '@shared/types';

interface IpcMainInvokeEvent {}

interface EventoWithDetails extends Evento {
  cliente_nome: string;
  collezione_nome: string;
  collezione_colore: string;
  data_inizio: string;
  data_fine: string;
}

function validateCrossCollection(db: Database, evento: Evento): string[] {
  const errors: string[] = [];
  
  // Verifica sovrapposizioni con altri appuntamenti dello stesso cliente
  const clienteOverlaps = db.prepare(`
    SELECT e.*, c.nome as collezione_nome
    FROM Eventi e
    JOIN Collezioni c ON e.collezione_id = c.id
    WHERE e.cliente_id = ?
    AND e.collezione_id != ?
    AND (
      (e.data_inizio <= ? AND e.data_fine >= ?)
      OR (e.data_inizio <= ? AND e.data_fine >= ?)
      OR (? <= e.data_fine AND ? >= e.data_inizio)
    )
    ${evento.id ? 'AND e.id != ?' : ''}
  `).all(
    evento.cliente_id,
    evento.collezione_id,
    evento.data_fine,
    evento.data_inizio,
    evento.data_fine,
    evento.data_inizio,
    evento.data_inizio,
    evento.data_fine,
    evento.id
  ) as EventoWithDetails[];

  if (clienteOverlaps.length > 0) {
    errors.push(`Il cliente ha già appuntamenti in altre collezioni: ${
      clienteOverlaps.map(e => `${e.collezione_nome} (${moment(e.data_inizio).format('DD/MM/YYYY HH:mm')})`).join(', ')
    }`);
  }

  // Verifica limiti giornalieri per collezione
  const dailyAppointments = db.prepare(`
    SELECT COUNT(*) as count
    FROM Eventi
    WHERE collezione_id = ?
    AND DATE(data_inizio) = DATE(?)
    ${evento.id ? 'AND id != ?' : ''}
  `).get(
    evento.collezione_id,
    evento.data_inizio,
    evento.id
  ) as { count: number };

  if (dailyAppointments.count >= 8) {
    errors.push('Raggiunto il limite massimo di appuntamenti giornalieri per questa collezione');
  }

  return errors;
}

function validateEvento(db: Database, evento: Evento): ValidationResponse {
  const errors: string[] = [];
  const startTime = moment(evento.data_inizio);
  const endTime = moment(evento.data_fine);
  const warnings: string[] = [];
  const checks = {
    timeConstraints: true,
    overlap: true,
    clientAvailability: true,
    collectionPeriod: true,
    duration: true
  };

  // Validazione orari lavorativi
  if (startTime.hours() < 9 || endTime.hours() >= 18 || 
      (startTime.hours() >= 13 && startTime.hours() < 14) ||
      (endTime.hours() > 13 && endTime.hours() <= 14)) {
    errors.push('Gli appuntamenti devono essere tra le 9:00-13:00 o 14:00-18:00');
    checks.timeConstraints = false;
  }

  // Validazione giorni lavorativi
  if (startTime.day() === 0 || startTime.day() === 6) {
    errors.push('Gli appuntamenti non possono essere nei weekend');
    checks.timeConstraints = false;
  }

  // Validazione durata minima/massima
  const durata = moment.duration(endTime.diff(startTime));
  if (durata.asMinutes() < 30) {
    errors.push('L\'appuntamento deve durare almeno 30 minuti');
    checks.duration = false;
  }
  if (durata.asHours() > 4) {
    errors.push('L\'appuntamento non può durare più di 4 ore');
    checks.duration = false;
    warnings.push('La durata dell\'appuntamento è particolarmente lunga');
  }

  // Verifica periodo collezione
  const collezione = db.prepare(`
    SELECT id, nome, data_inizio, data_fine 
    FROM Collezioni 
    WHERE id = ?
  `).get(evento.collezione_id) as Collezione;

if (collezione) {
    const collectionStart = moment(collezione.data_inizio, 'YYYY-MM-DD');
    const collectionEnd = moment(collezione.data_fine, 'YYYY-MM-DD').endOf('day');

    if (startTime.isBefore(collectionStart) || endTime.isAfter(collectionEnd)) {
      errors.push(`L'appuntamento deve essere nel periodo della collezione: ${
        collectionStart.format('DD/MM/YYYY')} - ${collectionEnd.format('DD/MM/YYYY')
      }`);
      checks.collectionPeriod = false;
    }
  } else {
    errors.push('Collezione non trovata');
    checks.collectionPeriod = false;
  }

  // Verifica sovrapposizioni nella stessa collezione
  const overlaps = db.prepare(`
    SELECT COUNT(*) as count
    FROM Eventi
    WHERE collezione_id = ?
    AND (
      (data_inizio <= ? AND data_fine > ?)
      OR (data_inizio < ? AND data_fine >= ?)
      OR (? <= data_fine AND ? >= data_inizio)
    )
    ${evento.id ? 'AND id != ?' : ''}
  `).get(
    evento.collezione_id,
    evento.data_fine,
    evento.data_inizio,
    evento.data_fine,
    evento.data_inizio,
    evento.data_inizio,
    evento.data_fine,
    evento.id
  ) as { count: number };

  if (overlaps.count > 0) {
    errors.push('L\'appuntamento si sovrappone con altri esistenti nella stessa collezione');
    checks.overlap = false;
  }

  // Validazione cross-collezione
  const crossCollectionErrors = validateCrossCollection(db, evento);
  if (crossCollectionErrors.length > 0) {
    errors.push(...crossCollectionErrors);
    checks.clientAvailability = false;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    duration: durata.asMinutes(),
    checks
  };
}

function getEventById(db: Database, id: number): APIResponse<EventoWithDetails> {
  try {
    const result = db.prepare(`
      SELECT 
        e.*,
        c.ragione_sociale as cliente_nome,
        col.nome as collezione_nome,
        col.colore as collezione_colore
      FROM Eventi e
      JOIN Clienti c ON e.cliente_id = c.id
      JOIN Collezioni col ON e.collezione_id = col.id
      WHERE e.id = ?
    `).get(id) as EventoWithDetails | undefined;

    if (!result) {
      return { success: false, error: 'Evento non trovato' };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: `Errore nel recupero dell'evento: ${(error as Error).message}`
    };
  }
}

export function setupEventiHandlers(db: Database): void {
  // GET ALL
  ipcMain.handle('eventi:getAll', (event: IpcMainInvokeEvent) => {
    try {
      const result = db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome,
          col.colore as collezione_colore
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
      `).all() as EventoWithDetails[];

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero degli eventi: ${(error as Error).message}`
      };
    }
  });

  // GET BY ID
  ipcMain.handle('eventi:getById', (event: IpcMainInvokeEvent, id: number) => {
    return getEventById(db, id);
  });

  // GET BY DATE RANGE
  ipcMain.handle('eventi:getByDateRange', 
    (event: IpcMainInvokeEvent, start: string, end: string) => {
    try {
      const result = db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome,
          col.colore as collezione_colore
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE e.data_inizio >= ? AND e.data_fine <= ?
      `).all(start, end) as EventoWithDetails[];

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero degli eventi: ${(error as Error).message}`
      };
    }
  });

  // GET BY CLIENTE
  ipcMain.handle('eventi:getByCliente', (event: IpcMainInvokeEvent, clienteId: number) => {
    try {
      const result = db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome,
          col.colore as collezione_colore
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE e.cliente_id = ?
      `).all(clienteId) as EventoWithDetails[];

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero degli eventi del cliente: ${(error as Error).message}`
      };
    }
  });

  // GET BY COLLEZIONE
  ipcMain.handle('eventi:getByCollezione', (event: IpcMainInvokeEvent, collezioneId: number) => {
    try {
      const result = db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome,
          col.colore as collezione_colore
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE e.collezione_id = ?
      `).all(collezioneId) as EventoWithDetails[];

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: `Errore nel recupero degli eventi della collezione: ${(error as Error).message}`
      };
    }
  });

  // VALIDATE
  ipcMain.handle('eventi:validate', (event: IpcMainInvokeEvent, evento: EventValidationRequest) => {
    const eventoToValidate: Evento = {
      ...evento,
      cliente_id: parseInt(evento.cliente_id),
      collezione_id: parseInt(evento.collezione_id)
    };
    return validateEvento(db, eventoToValidate);
  });

  // CREATE
  ipcMain.handle('eventi:create', (event: IpcMainInvokeEvent, evento: Omit<Evento, 'id'>) => {
    try {
      const validation = validateEvento(db, evento as Evento);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validazione fallita',
          errors: validation.errors
        };
      }

      const result = db.prepare(`
        INSERT INTO Eventi (
          cliente_id, collezione_id, data_inizio, 
          data_fine, note
        ) VALUES (?, ?, ?, ?, ?)
      `).run([
        evento.cliente_id,
        evento.collezione_id,
        evento.data_inizio,
        evento.data_fine,
        evento.note || null
      ]);

      if (result.changes > 0) {
        return getEventById(db, result.lastInsertRowid as number);
      }

      return {
        success: false,
        error: 'Nessuna riga inserita'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nella creazione dell'evento: ${(error as Error).message}`
      };
    }
  });

  // UPDATE
  ipcMain.handle('eventi:update', 
    (event: IpcMainInvokeEvent, id: number, eventoData: Partial<Evento>) => {
    try {
      const currentEvento = getEventById(db, id);
      if (!currentEvento.success) {
        return currentEvento;
      }

      const eventoToValidate = {
        ...currentEvento.data,
        ...eventoData
      };

      const validation = validateEvento(db, eventoToValidate as Evento);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validazione fallita',
          errors: validation.errors
        };
      }

      const updateFields = [];
      const updateValues = [];
      
      for (const [key, value] of Object.entries(eventoData)) {
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
        UPDATE Eventi 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(updateValues);

      if (result.changes > 0) {
        return getEventById(db, id);
      }

      return {
        success: false,
        error: 'Evento non trovato o nessuna modifica effettuata'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'aggiornamento dell'evento: ${(error as Error).message}`
      };
    }
  });

  // DELETE
  ipcMain.handle('eventi:delete', (event: IpcMainInvokeEvent, id: number) => {
    try {
      const result = db.prepare('DELETE FROM Eventi WHERE id = ?').run(id);

      if (result.changes > 0) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Evento non trovato'
      };
    } catch (error) {
      return {
        success: false,
        error: `Errore nell'eliminazione dell'evento: ${(error as Error).message}`
      };
    }
  });

  // VALIDATE BULK
  ipcMain.handle('eventi:validateBulk', (event: IpcMainInvokeEvent, eventi: EventValidationRequest[]) => {
    const results: { [key: string]: ValidationResponse } = {};
    
    for (const evento of eventi) {
      const eventoToValidate: Evento = {
        ...evento,
        cliente_id: parseInt(evento.cliente_id),
        collezione_id: parseInt(evento.collezione_id)
      };
      const validation = validateEvento(db, eventoToValidate);
      results[evento.id ? evento.id.toString() : 'new'] = validation;
    }

    return results;
  });
}
