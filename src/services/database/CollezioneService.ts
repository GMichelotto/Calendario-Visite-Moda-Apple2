// src/services/database/CollezioneService.ts

interface Collezione {
  id?: number;
  nome: string;
  colore: string;
  data_inizio: string;
  data_fine: string;
}

interface CollezioneWithStats extends Collezione {
  clienti_associati: number;
  appuntamenti_totali: number;
  disponibilita: number;
}

class CollezioneService {
  private ipcRenderer: typeof window.electron.ipcRenderer;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
  }

  async getAll(): Promise<Collezione[]> {
    return this.ipcRenderer.invoke('collezioni:getAll');
  }

  async getAllWithStats(): Promise<CollezioneWithStats[]> {
    return this.ipcRenderer.invoke('collezioni:getAllWithStats');
  }

  async getById(id: number): Promise<Collezione> {
    return this.ipcRenderer.invoke('collezioni:getById', id);
  }

  async create(collezione: Omit<Collezione, 'id'>): Promise<number> {
    return this.ipcRenderer.invoke('collezioni:create', collezione);
  }

  async update(id: number, collezione: Partial<Collezione>): Promise<boolean> {
    return this.ipcRenderer.invoke('collezioni:update', id, collezione);
  }

  async delete(id: number): Promise<boolean> {
    return this.ipcRenderer.invoke('collezioni:delete', id);
  }

  async getClienti(collezioneId: number): Promise<any[]> {
    return this.ipcRenderer.invoke('collezioni:getClienti', collezioneId);
  }

  async checkAvailability(collezioneId: number, start: string, end: string): Promise<boolean> {
    return this.ipcRenderer.invoke('collezioni:checkAvailability', collezioneId, start, end);
  }

  async importFromCSV(csvContent: string): Promise<{ success: boolean; errors: string[] }> {
    return this.ipcRenderer.invoke('collezioni:importCSV', csvContent);
  }
}

export default new CollezioneService();
