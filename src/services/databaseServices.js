class DatabaseService {
  async getClienti() {
    try {
      return await window.electronAPI.database.operation('getClienti');
    } catch (error) {
      console.error('Failed to get clienti:', error);
      throw error;
    }
  }

  async addCliente(cliente) {
    try {
      return await window.electronAPI.database.operation('addCliente', { cliente });
    } catch (error) {
      console.error('Failed to add cliente:', error);
      throw error;
    }
  }

  async getCollezioni() {
    try {
      return await window.electronAPI.database.operation('getCollezioni');
    } catch (error) {
      console.error('Failed to get collezioni:', error);
      throw error;
    }
  }

  async addCollezione(collezione) {
    try {
      return await window.electronAPI.database.operation('addCollezione', { collezione });
    } catch (error) {
      console.error('Failed to add collezione:', error);
      throw error;
    }
  }

  async getEventi() {
    try {
      return await window.electronAPI.database.operation('getEventi');
    } catch (error) {
      console.error('Failed to get eventi:', error);
      throw error;
    }
  }

  async addEvento(evento) {
    try {
      return await window.electronAPI.database.operation('addEvento', { evento });
    } catch (error) {
      console.error('Failed to add evento:', error);
      throw error;
    }
  }
async updateClienteCollezioneDuration(cliente_id, collezione_id, duration) {
    try {
      const stmt = this.db.prepare(`
        UPDATE ClientiCollezioni 
        SET tempo_visita = ? 
        WHERE cliente_id = ? AND collezione_id = ?
      `);

      return stmt.run(duration, cliente_id, collezione_id);
    } catch (error) {
      log.error('Error updating visita duration:', error);
      throw error;
    }
  }

  async getClienteCollezioneDuration(cliente_id, collezione_id) {
    try {
      const stmt = this.db.prepare(`
        SELECT tempo_visita 
        FROM ClientiCollezioni 
        WHERE cliente_id = ? AND collezione_id = ?
      `);

      const result = stmt.get(cliente_id, collezione_id);
      return result ? result.tempo_visita : 120; // default 120 minuti
    } catch (error) {
      log.error('Error getting visita duration:', error);
      throw error;
    }
  }

  async getCollezioneClientiDurations(collezione_id) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          cc.cliente_id,
          cc.tempo_visita,
          c.ragione_sociale as cliente_nome
        FROM ClientiCollezioni cc
        JOIN Clienti c ON c.id = cc.cliente_id
        WHERE cc.collezione_id = ?
      `);

      return stmt.all(collezione_id);
    } catch (error) {
      log.error('Error getting collezione client durations:', error);
      throw error;
    }
  }
// Aggiungi questi nuovi metodi alla classe DatabaseService esistente

class DatabaseService {
  // ... codice esistente ...

  async getEventiByCliente(cliente_id) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE e.cliente_id = ?
        ORDER BY e.data_inizio ASC
      `);
      
      return stmt.all(cliente_id);
    } catch (error) {
      log.error('Error getting eventi by cliente:', error);
      throw error;
    }
  }

  async getEventiByClienteAndDay(cliente_id, date) {
    try {
      const stmt = this.db.prepare(`
        SELECT *
        FROM Eventi
        WHERE cliente_id = ?
        AND date(data_inizio) = date(?)
      `);
      
      return stmt.all(cliente_id, date);
    } catch (error) {
      log.error('Error getting eventi by cliente and day:', error);
      throw error;
    }
  }

  async getEventiByClienteInRange(cliente_id, start_date, end_date) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE e.cliente_id = ?
        AND e.data_inizio >= ?
        AND e.data_fine <= ?
        ORDER BY e.data_inizio ASC
      `);
      
      return stmt.all(cliente_id, start_date, end_date);
    } catch (error) {
      log.error('Error getting eventi by range:', error);
      throw error;
    }
  }

  async getOverlappingEvents(start_date, end_date, exclude_event_id = null) {
    try {
      let query = `
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE (
          (data_inizio <= ? AND data_fine >= ?) OR
          (data_inizio <= ? AND data_fine >= ?) OR
          (data_inizio >= ? AND data_fine <= ?)
        )
      `;

      const params = [
        end_date, start_date,
        start_date, end_date,
        start_date, end_date
      ];

      if (exclude_event_id) {
        query += ' AND e.id != ?';
        params.push(exclude_event_id);
      }

      const stmt = this.db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      log.error('Error getting overlapping events:', error);
      throw error;
    }
  }

  async validateEventConstraints(eventData, exclude_event_id = null) {
    try {
      return this.db.transaction(() => {
        // 1. Verifica sovrapposizioni
        const overlappingEvents = this.getOverlappingEvents(
          eventData.data_inizio,
          eventData.data_fine,
          exclude_event_id
        );

        if (overlappingEvents.length > 0) {
          return {
            isValid: false,
            error: 'Esistono sovrapposizioni con altri appuntamenti'
          };
        }

        // 2. Verifica numero massimo appuntamenti giornalieri per cliente
        const dayEvents = this.getEventiByClienteAndDay(
          eventData.cliente_id,
          eventData.data_inizio
        );

        if (dayEvents.length >= 2 && !exclude_event_id) {
          return {
            isValid: false,
            error: 'Il cliente ha già raggiunto il numero massimo di appuntamenti per questo giorno'
          };
        }

        // 3. Verifica periodo collezione
        const collezione = this.db.prepare(
          'SELECT * FROM Collezioni WHERE id = ?'
        ).get(eventData.collezione_id);

        const eventStart = new Date(eventData.data_inizio);
        const eventEnd = new Date(eventData.data_fine);
        const collectionStart = new Date(collezione.data_apertura);
        const collectionEnd = new Date(collezione.data_chiusura);

        if (eventStart < collectionStart || eventEnd > collectionEnd) {
          return {
            isValid: false,
            error: 'L\'appuntamento deve essere all\'interno del periodo della collezione'
          };
        }

        // 4. Verifica durata visita
        const clienteCollezione = this.db.prepare(`
          SELECT tempo_visita
          FROM ClientiCollezioni
          WHERE cliente_id = ? AND collezione_id = ?
        `).get(eventData.cliente_id, eventData.collezione_id);

        const duration = (eventEnd - eventStart) / (1000 * 60); // durata in minuti
        if (duration !== clienteCollezione.tempo_visita) {
          return {
            isValid: false,
            error: `La durata dell'appuntamento deve essere di ${clienteCollezione.tempo_visita} minuti`
          };
        }

        return { isValid: true };
      })();
    } catch (error) {
      log.error('Error validating event constraints:', error);
      throw error;
    }
  }

  async getClienteWorkload(cliente_id, start_date, end_date) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          date(e.data_inizio) as giorno,
          COUNT(*) as num_appuntamenti,
          SUM(
            (strftime('%s', e.data_fine) - strftime('%s', e.data_inizio)) / 60
          ) as durata_totale
        FROM Eventi e
        WHERE e.cliente_id = ?
        AND date(e.data_inizio) BETWEEN date(?) AND date(?)
        GROUP BY date(e.data_inizio)
      `);

      return stmt.all(cliente_id, start_date, end_date);
    } catch (error) {
      log.error('Error getting cliente workload:', error);
      throw error;
    }
  }

  async getCollectionAvailability(collezione_id, date) {
    try {
      const stmt = this.db.prepare(`
        WITH TimeSlots AS (
          SELECT 
            time('09:00') as slot_start
          UNION ALL
          SELECT 
            time(
              strftime('%H:%M', slot_start, '+30 minutes')
            )
          FROM TimeSlots
          WHERE slot_start < time('17:30')
        ),
        Occupancy AS (
          SELECT 
            ts.slot_start,
            COUNT(e.id) as num_eventi
          FROM TimeSlots ts
          LEFT JOIN Eventi e ON 
            date(e.data_inizio) = date(?) AND
            time(e.data_inizio) <= ts.slot_start AND
            time(e.data_fine) > ts.slot_start AND
            e.collezione_id = ?
          GROUP BY ts.slot_start
        )
        SELECT 
          slot_start,
          CASE 
            WHEN num_eventi = 0 THEN 'available'
            ELSE 'occupied'
          END as status
        FROM Occupancy
        ORDER BY slot_start
      `);

      return stmt.all(date, collezione_id);
    } catch (error) {
      log.error('Error getting collection availability:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
