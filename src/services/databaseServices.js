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
}
}

export const databaseService = new DatabaseService();
