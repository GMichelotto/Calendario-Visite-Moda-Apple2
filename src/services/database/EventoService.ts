// src/services/database/EventoService.ts

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

class EventoService {
  private ipcRenderer: typeof window.electron.ipcRenderer;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
  }

  async getAll(): Promise<EventoWithDetails[]> {
    return this.ipcRenderer.invoke('eventi:getAll');
  }

  async getByDateRange(start: string, end: string): Promise<EventoWithDetails[]> {
    return this.ipcRenderer.invoke('eventi:getByDateRange', start, end);
  }

  async create(evento: Omit<Evento, 'id'>): Promise<number> {
    return this.ipcRenderer.invoke('eventi:create', evento);
  }

  async update(id: number, evento: Partial<Evento>): Promise<boolean> {
    return this.ipcRenderer.invoke('eventi:update', id, evento);
  }

  async delete(id: number): Promise<boolean> {
    return this.ipcRenderer.invoke('eventi:delete', id);
  }

  async validateEvent(evento: Partial<Evento>): Promise<{ 
    isValid: boolean; 
    errors: string[];
  }> {
    return this.ipcRenderer.invoke('eventi:validate', evento);
  }

  async getByCliente(clienteId: number): Promise<EventoWithDetails[]> {
    return this.ipcRenderer.invoke('eventi:getByCliente', clienteId);
  }

  async getByCollezione(collezioneId: number): Promise<EventoWithDetails[]> {
    return this.ipcRenderer.invoke('eventi:getByCollezione', collezioneId);
  }
}

export default new EventoService();
