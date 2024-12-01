// src/services/database/CollezioneService.ts
import { AppError, ErrorCode } from '../../types/errors';
import Logger from '../../utils/logger';

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
  private logger: typeof Logger;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
    this.logger = Logger;
  }

  async getAll(): Promise<Collezione[]> {
    try {
      this.logger.info('Fetching all collections', {
        component: 'CollezioneService',
        action: 'getAll'
      });

      const collections = await this.ipcRenderer.invoke('collezioni:getAll');

      this.logger.debug('Collections fetched successfully', {
        component: 'CollezioneService',
        action: 'getAll',
        count: collections.length
      });

      return collections;
    } catch (error) {
      this.logger.error('Failed to fetch collections', {
        component: 'CollezioneService',
        action: 'getAll',
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero delle collezioni',
        { originalError: error }
      );
    }
  }

  async getAllWithStats(): Promise<CollezioneWithStats[]> {
    try {
      this.logger.info('Fetching all collections with stats', {
        component: 'CollezioneService',
        action: 'getAllWithStats'
      });

      const collections = await this.ipcRenderer.invoke('collezioni:getAllWithStats');

      this.logger.debug('Collections with stats fetched successfully', {
        component: 'CollezioneService',
        action: 'getAllWithStats',
        count: collections.length
      });

      return collections;
    } catch (error) {
      this.logger.error('Failed to fetch collections with stats', {
        component: 'CollezioneService',
        action: 'getAllWithStats',
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero delle collezioni con statistiche',
        { originalError: error }
      );
    }
  }

  async getById(id: number): Promise<Collezione> {
    try {
      this.logger.info('Fetching collection by ID', {
        component: 'CollezioneService',
        action: 'getById',
        collectionId: id
      });

      const collection = await this.ipcRenderer.invoke('collezioni:getById', id);

      if (!collection) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Collezione con ID ${id} non trovata`
        );
      }

      this.logger.debug('Collection fetched successfully', {
        component: 'CollezioneService',
        action: 'getById',
        collectionId: id
      });

      return collection;
    } catch (error) {
      this.logger.error('Failed to fetch collection by ID', {
        component: 'CollezioneService',
        action: 'getById',
        collectionId: id,
        error
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero della collezione',
        { originalError: error }
      );
    }
  }

  async create(collezione: Omit<Collezione, 'id'>): Promise<number> {
    try {
      this.logger.info('Creating new collection', {
        component: 'CollezioneService',
        action: 'create',
        collectionData: collezione
      });

      const collectionId = await this.ipcRenderer.invoke('collezioni:create', collezione);

      this.logger.debug('Collection created successfully', {
        component: 'CollezioneService',
        action: 'create',
        collectionId
      });

      return collectionId;
    } catch (error) {
      this.logger.error('Failed to create collection', {
        component: 'CollezioneService',
        action: 'create',
        collectionData: collezione,
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nella creazione della collezione',
        { originalError: error }
      );
    }
  }

  async update(id: number, collezione: Partial<Collezione>): Promise<boolean> {
    try {
      this.logger.info('Updating collection', {
        component: 'CollezioneService',
        action: 'update',
        collectionId: id,
        updateData: collezione
      });

      const success = await this.ipcRenderer.invoke('collezioni:update', id, collezione);

      if (!success) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Collezione con ID ${id} non trovata per l'aggiornamento`
        );
      }

      this.logger.debug('Collection updated successfully', {
        component: 'CollezioneService',
        action: 'update',
        collectionId: id
      });

      return success;
    } catch (error) {
      this.logger.error('Failed to update collection', {
        component: 'CollezioneService',
        action: 'update',
        collectionId: id,
        updateData: collezione,
        error
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'aggiornamento della collezione',
        { originalError: error }
      );
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      this.logger.info('Deleting collection', {
        component: 'CollezioneService',
        action: 'delete',
        collectionId: id
      });

      const success = await this.ipcRenderer.invoke('collezioni:delete', id);

      if (!success) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Collezione con ID ${id} non trovata per l'eliminazione`
        );
      }

      this.logger.debug('Collection deleted successfully', {
        component: 'CollezioneService',
        action: 'delete',
        collectionId: id
      });

      return success;
    } catch (error) {
      this.logger.error('Failed to delete collection', {
        component: 'CollezioneService',
        action: 'delete',
        collectionId: id,
        error
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'eliminazione della collezione',
        { originalError: error }
      );
    }
  }

  async getClienti(collezioneId: number): Promise<any[]> {
    try {
      this.logger.info('Fetching clients for collection', {
        component: 'CollezioneService',
        action: 'getClienti',
        collectionId: collezioneId
      });

      const clients = await this.ipcRenderer.invoke('collezioni:getClienti', collezioneId);

      this.logger.debug('Clients fetched successfully for collection', {
        component: 'CollezioneService',
        action: 'getClienti',
        collectionId: collezioneId,
        count: clients.length
      });

      return clients;
    } catch (error) {
      this.logger.error('Failed to fetch clients for collection', {
        component: 'CollezioneService',
        action: 'getClienti',
        collectionId: collezioneId,
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero dei clienti della collezione',
        { originalError: error }
      );
    }
  }

  async checkAvailability(collezioneId: number, start: string, end: string): Promise<boolean> {
    try {
      this.logger.info('Checking collection availability', {
        component: 'CollezioneService',
        action: 'checkAvailability',
        collectionId: collezioneId,
        start,
        end
      });

      const isAvailable = await this.ipcRenderer.invoke(
        'collezioni:checkAvailability',
        collezioneId,
        start,
        end
      );

      this.logger.debug('Availability check completed', {
        component: 'CollezioneService',
        action: 'checkAvailability',
        collectionId: collezioneId,
        isAvailable
      });

      return isAvailable;
    } catch (error) {
      this.logger.error('Failed to check collection availability', {
        component: 'CollezioneService',
        action: 'checkAvailability',
        collectionId: collezioneId,
        start,
        end,
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel controllo disponibilità della collezione',
        { originalError: error }
      );
    }
  }

  async importFromCSV(csvContent: string): Promise<{ success: boolean; errors: string[] }> {
    try {
      this.logger.info('Starting CSV import for collections', {
        component: 'CollezioneService',
        action: 'importFromCSV',
        contentLength: csvContent.length
      });

      const result = await this.ipcRenderer.invoke('collezioni:importCSV', csvContent);

      if (result.errors.length > 0) {
        this.logger.warn('CSV import completed with errors', {
          component: 'CollezioneService',
          action: 'importFromCSV',
          errors: result.errors
        });
      } else {
        this.logger.debug('CSV import completed successfully', {
          component: 'CollezioneService',
          action: 'importFromCSV'
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to import CSV', {
        component: 'CollezioneService',
        action: 'importFromCSV',
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'importazione del CSV delle collezioni',
        { originalError: error }
      );
    }
  }
}

export default new CollezioneService();

/**
 * Commit Message:
 * feat: integrate error handling and logging in CollezioneService
 * 
 * Add comprehensive error handling and logging to all CollezioneService methods
 */
