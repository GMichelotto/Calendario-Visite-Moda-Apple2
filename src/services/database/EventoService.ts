// src/services/database/EventoService.ts
import { AppError, ErrorCode } from '../../types/errors';
import Logger from '../../utils/logger';

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
  private logger: typeof Logger;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
    this.logger = Logger;
  }

  async getAll(): Promise<EventoWithDetails[]> {
    try {
      this.logger.info('Fetching all events', {
        component: 'EventoService',
        action: 'getAll'
      });

      const events = await this.ipcRenderer.invoke('eventi:getAll');

      this.logger.debug('Events fetched successfully', {
        component: 'EventoService',
        action: 'getAll',
        count: events.length
      });

      return events;
    } catch (error) {
      this.logger.error('Failed to fetch events', {
        component: 'EventoService',
        action: 'getAll',
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero degli eventi',
        { originalError: error }
      );
    }
  }

  async getByDateRange(start: string, end: string): Promise<EventoWithDetails[]> {
    try {
      this.logger.info('Fetching events by date range', {
        component: 'EventoService',
        action: 'getByDateRange',
        start,
        end
      });

      const events = await this.ipcRenderer.invoke('eventi:getByDateRange', start, end);

      this.logger.debug('Events in date range fetched successfully', {
        component: 'EventoService',
        action: 'getByDateRange',
        count: events.length,
        start,
        end
      });

      return events;
    } catch (error) {
      this.logger.error('Failed to fetch events by date range', {
        component: 'EventoService',
        action: 'getByDateRange',
        start,
        end,
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero degli eventi per intervallo di date',
        { originalError: error }
      );
    }
  }

  async create(evento: Omit<Evento, 'id'>): Promise<number> {
    try {
      this.logger.info('Creating new event', {
        component: 'EventoService',
        action: 'create',
        eventData: evento
      });

      // Validate event before creation
      const validation = await this.validateEvent(evento);
      if (!validation.isValid) {
        throw new AppError(
          ErrorCode.VALIDATION,
          'Validazione evento fallita',
          { errors: validation.errors }
        );
      }

      const eventId = await this.ipcRenderer.invoke('eventi:create', evento);

      this.logger.debug('Event created successfully', {
        component: 'EventoService',
        action: 'create',
        eventId
      });

      return eventId;
    } catch (error) {
      this.logger.error('Failed to create event', {
        component: 'EventoService',
        action: 'create',
        eventData: evento,
        error
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nella creazione dell\'evento',
        { originalError: error }
      );
    }
  }

  async update(id: number, evento: Partial<Evento>): Promise<boolean> {
    try {
      this.logger.info('Updating event', {
        component: 'EventoService',
        action: 'update',
        eventId: id,
        updateData: evento
      });

      // Validate event before update
      const validation = await this.validateEvent({ ...evento, id });
      if (!validation.isValid) {
        throw new AppError(
          ErrorCode.VALIDATION,
          'Validazione evento fallita',
          { errors: validation.errors }
        );
      }

      const success = await this.ipcRenderer.invoke('eventi:update', id, evento);

      if (!success) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Evento con ID ${id} non trovato per l'aggiornamento`
        );
      }

      this.logger.debug('Event updated successfully', {
        component: 'EventoService',
        action: 'update',
        eventId: id
      });

      return success;
    } catch (error) {
      this.logger.error('Failed to update event', {
        component: 'EventoService',
        action: 'update',
        eventId: id,
        updateData: evento,
        error
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'aggiornamento dell\'evento',
        { originalError: error }
      );
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      this.logger.info('Deleting event', {
        component: 'EventoService',
        action: 'delete',
        eventId: id
      });

      const success = await this.ipcRenderer.invoke('eventi:delete', id);

      if (!success) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          `Evento con ID ${id} non trovato per l'eliminazione`
        );
      }

      this.logger.debug('Event deleted successfully', {
        component: 'EventoService',
        action: 'delete',
        eventId: id
      });

      return success;
    } catch (error) {
      this.logger.error('Failed to delete event', {
        component: 'EventoService',
        action: 'delete',
        eventId: id,
        error
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nell\'eliminazione dell\'evento',
        { originalError: error }
      );
    }
  }

  async validateEvent(evento: Partial<Evento>): Promise<{ 
    isValid: boolean; 
    errors: string[];
  }> {
    try {
      this.logger.info('Validating event', {
        component: 'EventoService',
        action: 'validateEvent',
        eventData: evento
      });

      const result = await this.ipcRenderer.invoke('eventi:validate', evento);

      if (!result.isValid) {
        this.logger.warn('Event validation failed', {
          component: 'EventoService',
          action: 'validateEvent',
          errors: result.errors
        });
      } else {
        this.logger.debug('Event validation successful', {
          component: 'EventoService',
          action: 'validateEvent'
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Error during event validation', {
        component: 'EventoService',
        action: 'validateEvent',
        eventData: evento,
        error
      });

      throw new AppError(
        ErrorCode.VALIDATION,
        'Errore durante la validazione dell\'evento',
        { originalError: error }
      );
    }
  }

  async getByCliente(clienteId: number): Promise<EventoWithDetails[]> {
    try {
      this.logger.info('Fetching events by client', {
        component: 'EventoService',
        action: 'getByCliente',
        clienteId
      });

      const events = await this.ipcRenderer.invoke('eventi:getByCliente', clienteId);

      this.logger.debug('Events by client fetched successfully', {
        component: 'EventoService',
        action: 'getByCliente',
        clienteId,
        count: events.length
      });

      return events;
    } catch (error) {
      this.logger.error('Failed to fetch events by client', {
        component: 'EventoService',
        action: 'getByCliente',
        clienteId,
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero degli eventi per cliente',
        { originalError: error }
      );
    }
  }

  async getByCollezione(collezioneId: number): Promise<EventoWithDetails[]> {
    try {
      this.logger.info('Fetching events by collection', {
        component: 'EventoService',
        action: 'getByCollezione',
        collezioneId
      });

      const events = await this.ipcRenderer.invoke('eventi:getByCollezione', collezioneId);

      this.logger.debug('Events by collection fetched successfully', {
        component: 'EventoService',
        action: 'getByCollezione',
        collezioneId,
        count: events.length
      });

      return events;
    } catch (error) {
      this.logger.error('Failed to fetch events by collection', {
        component: 'EventoService',
        action: 'getByCollezione',
        collezioneId,
        error
      });

      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero degli eventi per collezione',
        { originalError: error }
      );
    }
  }
}

export default new EventoService();

/**
 * Commit Message:
 * feat: integrate error handling and logging in EventoService
 * 
 * Add comprehensive error handling and logging to all EventoService methods
 */
