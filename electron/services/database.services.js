// database.service.js
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const log = require('electron-log');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = this.getDatabasePath();
  }

  // ... [Previous initialization code remains the same]

  // =============== CLIENTI OPERATIONS ===============

  async getClienti() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          c.*,
          GROUP_CONCAT(cc.collezione_id) as collezioni_ids,
          GROUP_CONCAT(col.nome) as collezioni_nomi
        FROM Clienti c
        LEFT JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
        LEFT JOIN Collezioni col ON cc.collezione_id = col.id
        GROUP BY c.id
      `);
      return stmt.all();
    } catch (error) {
      log.error('Error getting clienti:', error);
      throw error;
    }
  }

  async getClienteById(id) {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          c.*,
          GROUP_CONCAT(cc.collezione_id) as collezioni_ids,
          GROUP_CONCAT(col.nome) as collezioni_nomi
        FROM Clienti c
        LEFT JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
        LEFT JOIN Collezioni col ON cc.collezione_id = col.id
        WHERE c.id = ?
        GROUP BY c.id
      `);
      return stmt.get(id);
    } catch (error) {
      log.error(`Error getting cliente ${id}:`, error);
      throw error;
    }
  }

  async createCliente(clienteData) {
    const {
      ragione_sociale,
      indirizzo,
      cap,
      citta,
      provincia,
      regione,
      telefono,
      cellulare,
      email,
      sito_web,
      collezioni
    } = clienteData;

    try {
      return this.db.transaction(() => {
        // Insert cliente
        const insertCliente = this.db.prepare(`
          INSERT INTO Clienti (
            ragione_sociale, indirizzo, cap, citta, provincia, 
            regione, telefono, cellulare, email, sito_web
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertCliente.run(
          ragione_sociale,
          indirizzo,
          cap,
          citta,
          provincia,
          regione,
          telefono,
          cellulare,
          email,
          sito_web
        );

        // Insert collezioni relationships
        if (collezioni && collezioni.length > 0) {
          const insertClienteCollezioni = this.db.prepare(`
            INSERT INTO ClientiCollezioni (
              cliente_id, collezione_id, tempo_visita, priorita
            ) VALUES (?, ?, ?, ?)
          `);

          for (const collezione of collezioni) {
            insertClienteCollezioni.run(
              result.lastInsertRowid,
              collezione.id,
              collezione.tempo_visita || 120,
              collezione.priorita || 2
            );
          }
        }

        return result.lastInsertRowid;
      })();
    } catch (error) {
      log.error('Error creating cliente:', error);
      throw error;
    }
  }

  async updateCliente(id, clienteData) {
    const {
      ragione_sociale,
      indirizzo,
      cap,
      citta,
      provincia,
      regione,
      telefono,
      cellulare,
      email,
      sito_web,
      collezioni
    } = clienteData;

    try {
      return this.db.transaction(() => {
        // Update cliente
        const updateCliente = this.db.prepare(`
          UPDATE Clienti 
          SET ragione_sociale = ?, indirizzo = ?, cap = ?, 
              citta = ?, provincia = ?, regione = ?, 
              telefono = ?, cellulare = ?, email = ?, sito_web = ?
          WHERE id = ?
        `);

        updateCliente.run(
          ragione_sociale,
          indirizzo,
          cap,
          citta,
          provincia,
          regione,
          telefono,
          cellulare,
          email,
          sito_web,
          id
        );

        // Update collezioni relationships
        const deleteOldCollezioni = this.db.prepare(
          'DELETE FROM ClientiCollezioni WHERE cliente_id = ?'
        );
        deleteOldCollezioni.run(id);

        if (collezioni && collezioni.length > 0) {
          const insertClienteCollezioni = this.db.prepare(`
            INSERT INTO ClientiCollezioni (
              cliente_id, collezione_id, tempo_visita, priorita
            ) VALUES (?, ?, ?, ?)
          `);

          for (const collezione of collezioni) {
            insertClienteCollezioni.run(
              id,
              collezione.id,
              collezione.tempo_visita || 120,
              collezione.priorita || 2
            );
          }
        }

        return id;
      })();
    } catch (error) {
      log.error(`Error updating cliente ${id}:`, error);
      throw error;
    }
  }

  async deleteCliente(id) {
    try {
      return this.db.transaction(() => {
        // Delete related records first
        const deleteCollezioni = this.db.prepare(
          'DELETE FROM ClientiCollezioni WHERE cliente_id = ?'
        );
        const deleteEventi = this.db.prepare(
          'DELETE FROM Eventi WHERE cliente_id = ?'
        );
        
        deleteCollezioni.run(id);
        deleteEventi.run(id);

        // Delete cliente
        const deleteCliente = this.db.prepare(
          'DELETE FROM Clienti WHERE id = ?'
        );
        return deleteCliente.run(id);
      })();
    } catch (error) {
      log.error(`Error deleting cliente ${id}:`, error);
      throw error;
    }
  }

  // =============== COLLEZIONI OPERATIONS ===============

  async getCollezioni() {
    try {
      return this.db.prepare('SELECT * FROM Collezioni').all();
    } catch (error) {
      log.error('Error getting collezioni:', error);
      throw error;
    }
  }

  async getCollezioneById(id) {
    try {
      return this.db.prepare('SELECT * FROM Collezioni WHERE id = ?').get(id);
    } catch (error) {
      log.error(`Error getting collezione ${id}:`, error);
      throw error;
    }
  }

  async createCollezione(collezioneData) {
    const { nome, colore, data_apertura, data_chiusura } = collezioneData;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO Collezioni (nome, colore, data_apertura, data_chiusura)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(nome, colore, data_apertura, data_chiusura);
      return result.lastInsertRowid;
    } catch (error) {
      log.error('Error creating collezione:', error);
      throw error;
    }
  }

  async updateCollezione(id, collezioneData) {
    const { nome, colore, data_apertura, data_chiusura } = collezioneData;

    try {
      const stmt = this.db.prepare(`
        UPDATE Collezioni 
        SET nome = ?, colore = ?, data_apertura = ?, data_chiusura = ?
        WHERE id = ?
      `);

      return stmt.run(nome, colore, data_apertura, data_chiusura, id);
    } catch (error) {
      log.error(`Error updating collezione ${id}:`, error);
      throw error;
    }
  }

  async deleteCollezione(id) {
    try {
      return this.db.transaction(() => {
        // Delete related records first
        const deleteClienteCollezioni = this.db.prepare(
          'DELETE FROM ClientiCollezioni WHERE collezione_id = ?'
        );
        const deleteEventi = this.db.prepare(
          'DELETE FROM Eventi WHERE collezione_id = ?'
        );
        
        deleteClienteCollezioni.run(id);
        deleteEventi.run(id);

        // Delete collezione
        const deleteCollezione = this.db.prepare(
          'DELETE FROM Collezioni WHERE id = ?'
        );
        return deleteCollezione.run(id);
      })();
    } catch (error) {
      log.error(`Error deleting collezione ${id}:`, error);
      throw error;
    }
  }

  // =============== EVENTI OPERATIONS ===============

  async getEventi() {
    try {
      return this.db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
      `).all();
    } catch (error) {
      log.error('Error getting eventi:', error);
      throw error;
    }
  }

  async getEventoById(id) {
    try {
      return this.db.prepare(`
        SELECT 
          e.*,
          c.ragione_sociale as cliente_nome,
          col.nome as collezione_nome
        FROM Eventi e
        JOIN Clienti c ON e.cliente_id = c.id
        JOIN Collezioni col ON e.collezione_id = col.id
        WHERE e.id = ?
      `).get(id);
    } catch (error) {
      log.error(`Error getting evento ${id}:`, error);
      throw error;
    }
  }

  async createEvento(eventoData) {
    const { cliente_id, collezione_id, data_inizio, data_fine } = eventoData;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO Eventi (cliente_id, collezione_id, data_inizio, data_fine)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(cliente_id, collezione_id, data_inizio, data_fine);
      return result.lastInsertRowid;
    } catch (error) {
      log.error('Error creating evento:', error);
      throw error;
    }
  }

  async updateEvento(id, eventoData) {
    const { cliente_id, collezione_id, data_inizio, data_fine } = eventoData;

    try {
      const stmt = this.db.prepare(`
        UPDATE Eventi 
        SET cliente_id = ?, collezione_id = ?, data_inizio = ?, data_fine = ?
        WHERE id = ?
      `);

      return stmt.run(cliente_id, collezione_id, data_inizio, data_fine, id);
    } catch (error) {
      log.error(`Error updating evento ${id}:`, error);
      throw error;
    }
  }

  async deleteEvento(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM Eventi WHERE id = ?');
      return stmt.run(id);
    } catch (error) {
      log.error(`Error deleting evento ${id}:`, error);
      throw error;
    }
  }

  // =============== UTILITY OPERATIONS ===============

  async validateEventOverlap(start, end, excludeId = null) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM Eventi
        WHERE (
          (data_inizio <= ? AND data_fine >= ?) OR
          (data_inizio <= ? AND data_fine >= ?) OR
          (data_inizio >= ? AND data_fine <= ?)
        )
        ${excludeId ? 'AND id != ?' : ''}
      `;

      const params = [end, start, start, end, start, end];
      if (excludeId) params.push(excludeId);

      const result = this.db.prepare(query).get(...params);
      return result.count > 0;
    } catch (error) {
      log.error('Error validating event overlap:', error);
      throw error;
    }
  }

  async validateCollezioneDate(collezione_id, date) {
    try {
      const result = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM Collezioni
        WHERE id = ?
        AND data_apertura <= ?
        AND data_chiusura >= ?
      `).get(collezione_id, date, date);

      return result.count > 0;
    } catch (error) {
      log.error('Error validating collezione date:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
