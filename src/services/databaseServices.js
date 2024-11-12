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
}

export const databaseService = new DatabaseService();
