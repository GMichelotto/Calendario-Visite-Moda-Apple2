// src/services/database/ClientService.ts

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
}

interface ClienteWithCollezioni extends Cliente {
  collezioni: string[];
}

class ClientService {
  private ipcRenderer: typeof window.electron.ipcRenderer;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
  }

  async getAll(): Promise<Cliente[]> {
    return this.ipcRenderer.invoke('clienti:getAll');
  }

  async getAllWithCollezioni(): Promise<ClienteWithCollezioni[]> {
    return this.ipcRenderer.invoke('clienti:getAllWithCollezioni');
  }

  async getById(id: number): Promise<Cliente> {
    return this.ipcRenderer.invoke('clienti:getById', id);
  }

  async create(cliente: Omit<Cliente, 'id'>): Promise<number> {
    return this.ipcRenderer.invoke('clienti:create', cliente);
  }

  async update(id: number, cliente: Partial<Cliente>): Promise<boolean> {
    return this.ipcRenderer.invoke('clienti:update', id, cliente);
  }

  async delete(id: number): Promise<boolean> {
    return this.ipcRenderer.invoke('clienti:delete', id);
  }

  async assignCollezione(clienteId: number, collezioneId: number, tempoVisita: number = 120): Promise<boolean> {
    return this.ipcRenderer.invoke('clienti:assignCollezione', clienteId, collezioneId, tempoVisita);
  }

  async removeCollezione(clienteId: number, collezioneId: number): Promise<boolean> {
    return this.ipcRenderer.invoke('clienti:removeCollezione', clienteId, collezioneId);
  }

  async importFromCSV(csvContent: string): Promise<{ success: boolean; errors: string[] }> {
    return this.ipcRenderer.invoke('clienti:importCSV', csvContent);
  }
}

export default new ClientService();
