// src/services/database/ClientService.ts

import { Cliente } from '../../types/database';
import { AppError, ErrorCode } from '../../types/errors';
import Logger from '../../utils/logger';

type ServiceResult<T> = Promise<T>;

interface IClienteService {
  getAll(): ServiceResult<Cliente[]>;
  getById(id: number): ServiceResult<Cliente | null>;
  create(clienteData: Omit<Cliente, 'id'>): ServiceResult<Cliente | null>;
  update(id: number, clienteData: Partial<Cliente>): ServiceResult<boolean>;
  delete(id: number): ServiceResult<boolean>;
}

class ClientService implements IClienteService {
  private ipcRenderer: typeof window.electron.ipcRenderer;
  private logger: typeof Logger;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
    this.logger = Logger;
  }

  async create(clienteData: Omit<Cliente, 'id'>): ServiceResult<Cliente | null> {
    try {
      const clientId = await this.ipcRenderer.invoke('clienti:create', clienteData);
      if (!clientId) return null;
      
      const newClient = await this.getById(clientId);
      return newClient;
    } catch (error) {
      this.logger.error('Failed to create client', {
        component: 'ClientService',
        action: 'create',
        error
      });
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nella creazione del cliente',
        { originalError: error }
      );
    }
  }

  // ... altri metodi rimangono gli stessi
}

// Esporta un'istanza singleton con tipo stretto
const clientService = new ClientService() satisfies IClienteService;
export default clientService;
