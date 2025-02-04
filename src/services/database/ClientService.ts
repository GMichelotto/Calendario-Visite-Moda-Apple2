// src/services/database/ClientService.ts
import { AppError, ErrorCode } from '../../types/errors';
import Logger from '../../utils/logger';
import type { Cliente } from '@shared/types';

interface IClienteService {
  getAll(): Promise<Cliente[]>;
  getById(id: number): Promise<Cliente | null>;
  create(clienteData: Omit<Cliente, 'id'>): Promise<Cliente | null>;
  update(id: number, clienteData: Partial<Cliente>): Promise<boolean>;
  delete(id: number): Promise<boolean>;
  getAllWithCollezioni(): Promise<(Cliente & { collezioni: string[] })[]>;
  assignCollezione(clienteId: number, collezioneId: number, tempoVisita?: number): Promise<boolean>;
  removeCollezione(clienteId: number, collezioneId: number): Promise<boolean>;
  importFromCSV(csvContent: string): Promise<{ success: boolean; errors: string[] }>;
}

class ClientService implements IClienteService {
  private ipcRenderer: typeof window.electron.ipcRenderer;
  private logger: typeof Logger;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
    this.logger = Logger;
  }

  async getAll(): Promise<Cliente[]> {
    try {
      this.logger.info('Fetching all clients', { 
        component: 'ClientService', 
        action: 'getAll' 
      });

      const clients = await this.ipcRenderer.invoke('clienti:getAll');
      
      this.logger.debug('Clients fetched successfully', {
        component: 'ClientService',
        action: 'getAll',
        count: clients.length
      });

      return clients;
    } catch (error) {
      this.logger.error('Failed to fetch clients', {
        component: 'ClientService',
        action: 'getAll',
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero dei clienti',
        { originalError: error }
      );
    }
  }

  async getAllWithCollezioni(): Promise<(Cliente & { collezioni: string[] })[]> {
    try {
      this.logger.info('Fetching all clients with collections', {
        component: 'ClientService',
        action: 'getAllWithCollezioni'
      });

      const clients = await this.ipcRenderer.invoke('clienti:getAllWithCollezioni');
      
      this.logger.debug('Clients with collections fetched successfully', {
        component: 'ClientService',
        action: 'getAllWithCollezioni',
        count: clients.length
      });

      return clients;
    } catch (error) {
      this.logger.error('Failed to fetch clients with collections', {
        component: 'ClientService',
        action: 'getAllWithCollezioni',
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero dei clienti con collezioni',
        { originalError: error }
      );
    }
  }

  async getById(id: number): Promise<Cliente | null> {
    try {
      this.logger.info('Fetching client by ID', {
        component: 'ClientService',
        action: 'getById',
        clientId: id
      });

      const client = await this.ipcRenderer.invoke('clienti:getById', id);
      
      if (!client) {
        this.logger.warn(`Client with ID ${id} not found`, {
          component: 'ClientService',
          action: 'getById'
        });
        return null;
      }

      this.logger.debug('Client fetched successfully', {
        component: 'ClientService',
        action: 'getById',
        clientId: id
      });

      return client;
    } catch (error) {
      this.logger.error('Failed to fetch client by ID', {
        component: 'ClientService',
        action: 'getById',
        clientId: id,
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero del cliente',
        { originalError: error }
      );
    }
  }

  async create(clienteData: Omit<Cliente, 'id'>): Promise<Cliente | null> {
    try {
      this.logger.info('Creating new client', {
        component: 'ClientService',
        action: 'create',
        clientData: { ...clienteData }
      });

      const clientId = await this.ipcRenderer.invoke('clienti:create', clienteData);
      
      if (!clientId) {
        this.logger.warn('Failed to create client - no ID returned', {
          component: 'ClientService',
          action: 'create'
        });
        return null;
      }

      const newClient = await this.getById(clientId);
      if (!newClient) {
        this.logger.error('Created client could not be fetched', {
          component: 'ClientService',
          action: 'create',
          clientId
        });
        return null;
      }

      this.logger.debug('Client created successfully', {
        component: 'ClientService',
        action: 'create',
        clientId
      });

      return newClient;
    } catch (error) {
      this.logger.error('Failed to create client', {
        component: 'ClientService',
        action: 'create',
        clientData: clienteData,
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nella creazione del cliente',
        { originalError: error }
      );
    }
  }

  async update(id: number, clienteData: Partial<Cliente>): Promise<boolean> {
    try {
      this.logger.info('Updating client', {
        component: 'ClientService',
        action: 'update',
        clientId: id,
        updateData: clienteData
      });

      const success = await this.ipcRenderer.invoke('clienti:update', id, clienteData);
      
      if (!success) {
        this.logger.warn(`Client with ID ${id} not found for update`, {
          component: 'ClientService',
          action: 'update'
        });
        return false;
      }

      this.logger.debug('Client updated successfully', {
        component: 'ClientService',
        action: 'update',
        clientId: id
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to update client', {
        component: 'ClientService',
        action: 'update',
        clientId: id,
        updateData: clienteData,
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'aggiornamento del cliente',
        { originalError: error }
      );
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      this.logger.info('Deleting client', {
        component: 'ClientService',
        action: 'delete',
        clientId: id
      });

      const success = await this.ipcRenderer.invoke('clienti:delete', id);
      
      if (!success) {
        this.logger.warn(`Client with ID ${id} not found for deletion`, {
          component: 'ClientService',
          action: 'delete'
        });
        return false;
      }

      this.logger.debug('Client deleted successfully', {
        component: 'ClientService',
        action: 'delete',
        clientId: id
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to delete client', {
        component: 'ClientService',
        action: 'delete',
        clientId: id,
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'eliminazione del cliente',
        { originalError: error }
      );
    }
  }

  async assignCollezione(clienteId: number, collezioneId: number, tempoVisita: number = 120): Promise<boolean> {
    try {
      this.logger.info('Assigning collection to client', {
        component: 'ClientService',
        action: 'assignCollezione',
        clientId: clienteId,
        collezioneId: collezioneId,
        tempoVisita
      });

      const success = await this.ipcRenderer.invoke(
        'clienti:assignCollezione', 
        clienteId, 
        collezioneId, 
        tempoVisita
      );
      
      if (!success) {
        this.logger.warn('Failed to assign collection to client', {
          component: 'ClientService',
          action: 'assignCollezione',
          clientId: clienteId,
          collezioneId: collezioneId
        });
        return false;
      }

      this.logger.debug('Collection assigned successfully', {
        component: 'ClientService',
        action: 'assignCollezione',
        clientId: clienteId,
        collezioneId: collezioneId
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to assign collection', {
        component: 'ClientService',
        action: 'assignCollezione',
        clientId: clienteId,
        collezioneId: collezioneId,
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'assegnazione della collezione al cliente',
        { originalError: error }
      );
    }
  }

  async removeCollezione(clienteId: number, collezioneId: number): Promise<boolean> {
    try {
      this.logger.info('Removing collection from client', {
        component: 'ClientService',
        action: 'removeCollezione',
        clientId: clienteId,
        collezioneId: collezioneId
      });

      const success = await this.ipcRenderer.invoke(
        'clienti:removeCollezione', 
        clienteId, 
        collezioneId
      );
      
      if (!success) {
        this.logger.warn('Failed to remove collection from client', {
          component: 'ClientService',
          action: 'removeCollezione',
          clientId: clienteId,
          collezioneId: collezioneId
        });
        return false;
      }

      this.logger.debug('Collection removed successfully', {
        component: 'ClientService',
        action: 'removeCollezione',
        clientId: clienteId,
        collezioneId: collezioneId
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to remove collection', {
        component: 'ClientService',
        action: 'removeCollezione',
        clientId: clienteId,
        collezioneId: collezioneId,
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nella rimozione della collezione dal cliente',
        { originalError: error }
      );
    }
  }

  async importFromCSV(csvContent: string): Promise<{ success: boolean; errors: string[] }> {
    try {
      this.logger.info('Starting CSV import', {
        component: 'ClientService',
        action: 'importFromCSV',
        contentLength: csvContent.length
      });

      const result = await this.ipcRenderer.invoke('clienti:importCSV', csvContent);
      
      if (result.errors && result.errors.length > 0) {
        this.logger.warn('CSV import completed with errors', {
          component: 'ClientService',
          action: 'importFromCSV',
          errors: result.errors
        });
      } else {
        this.logger.debug('CSV import completed successfully', {
          component: 'ClientService',
          action: 'importFromCSV'
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to import CSV', {
        component: 'ClientService',
        action: 'importFromCSV',
        error
      });
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'importazione del CSV',
        { originalError: error }
      );
    }
  }
}

export default new ClientService();
