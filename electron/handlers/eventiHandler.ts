// electron/handlers/eventiHandler.ts

import { ipcMain } from 'electron';
import type { Database } from 'better-sqlite3';
import moment from 'moment';

interface Evento {
  id?: number;
  cliente_id: number;
  collezione_id: number;
  data_inizio: string;
  data_fine: string;
  note?: string;
}

interface EventoWithDetails extends Evento {
  cliente_nome: string;
  collezione_nome: string;
  collezione_colore: string;
}

interface Collezione {
  data_inizio: string;
  data_fine: string;
}

export function setupEventiHandlers(db: Database) {
  ipcMain.handle('eventi:validate', async (_, evento: Evento) => {
    const errors: string[] = [];
    const startTime = moment(evento.data_inizio);
    const endTime = moment(evento.data_fine);

    // Verifica orari lavorativi
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
    ) as { count: number };

    if (overlaps.count > 0) {
      errors.push('L\'appuntamento si sovrappone con altri esistenti');
    }

    // Verifica periodo collezione
    const collezione = db.prepare(`
      SELECT data_inizio, data_fine
      FROM Collezioni
      WHERE id = ?
    `).get(evento.collezione_id) as Collezione;

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
  });
}
