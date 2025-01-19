import { BaseService } from './BaseServices';
import { AppError, ErrorCode } from '../../types/errors';
import { Cliente, Collezione, Evento, ClienteCollezione } from '../../types/database';
import Logger from '../../utils/logger';

interface DatabaseOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface EventOverlapParams {
  start_date: Date;
  end_date: Date;
  exclude_event_id?: string | null;
}

interface ClientWorkload {
  giorno: string;
  num_appuntamenti: number;
  durata_totale: number;
}

interface CollectionAvailability {
  slot_start: string;
  status: 'available' | 'occupied';
}

class DatabaseService extends BaseService<any> {
  protected entityName = 'Database';
  protected tableName = 'database';

  async getClienti(): Promise<Cliente[]> {
    try {
      const result = await window.electronAPI.database.operation('getClienti');
      Logger.info('Got clienti', { count: result.length });
      return result;
    } catch (error) {
      Logger.error('Failed to get clienti:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero dei clienti',
        { originalError: error }
      );
    }
  }

  async addCliente(cliente: Omit<Cliente, 'id'>): Promise<DatabaseOperationResult<Cliente>> {
    try {
      const result = await window.electronAPI.database.operation('addCliente', { cliente });
      Logger.info('Added cliente', { cliente_id: result.id });
      return { success: true, data: result };
    } catch (error) {
      Logger.error('Failed to add cliente:', error);
      throw new AppError(
        ErrorCode.DB_INSERT,
        'Errore nell\'aggiunta del cliente',
        { originalError: error }
      );
    }
  }

  async getCollezioni(): Promise<Collezione[]> {
    try {
      const result = await window.electronAPI.database.operation('getCollezioni');
      Logger.info('Got collezioni', { count: result.length });
      return result;
    } catch (error) {
      Logger.error('Failed to get collezioni:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero delle collezioni',
        { originalError: error }
      );
    }
  }

  async addCollezione(collezione: Omit<Collezione, 'id'>): Promise<DatabaseOperationResult<Collezione>> {
    try {
      const result = await window.electronAPI.database.operation('addCollezione', { collezione });
      Logger.info('Added collezione', { collezione_id: result.id });
      return { success: true, data: result };
    } catch (error) {
      Logger.error('Failed to add collezione:', error);
      throw new AppError(
        ErrorCode.DB_INSERT,
        'Errore nell\'aggiunta della collezione',
        { originalError: error }
      );
    }
  }

  async updateClienteCollezioneDuration(
    cliente_id: string,
    collezione_id: string,
    duration: number
  ): Promise<DatabaseOperationResult<void>> {
    try {
      await window.electronAPI.database.operation('updateClienteCollezioneDuration', {
        cliente_id,
        collezione_id,
        duration
      });
      Logger.info('Updated visita duration', { cliente_id, collezione_id, duration });
      return { success: true };
    } catch (error) {
      Logger.error('Error updating visita duration:', error);
      throw new AppError(
        ErrorCode.DB_UPDATE,
        'Errore nell\'aggiornamento della durata visita',
        { originalError: error }
      );
    }
  }

  async getClienteCollezioneDuration(
    cliente_id: string,
    collezione_id: string
  ): Promise<number> {
    try {
      const result = await window.electronAPI.database.operation('getClienteCollezioneDuration', {
        cliente_id,
        collezione_id
      });
      return result?.tempo_visita || 120; // default 120 minuti
    } catch (error) {
      Logger.error('Error getting visita duration:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero della durata visita',
        { originalError: error }
      );
    }
  }

  async getCollezioneClientiDurations(collezione_id: string): Promise<ClienteCollezione[]> {
    try {
      return await window.electronAPI.database.operation('getCollezioneClientiDurations', {
        collezione_id
      });
    } catch (error) {
      Logger.error('Error getting collezione client durations:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero delle durate cliente',
        { originalError: error }
      );
    }
  }

  async getEventiByCliente(cliente_id: string): Promise<Evento[]> {
    try {
      return await window.electronAPI.database.operation('getEventiByCliente', { cliente_id });
    } catch (error) {
      Logger.error('Error getting eventi by cliente:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero degli eventi del cliente',
        { originalError: error }
      );
    }
  }

  async getEventiByClienteAndDay(cliente_id: string, date: string): Promise<Evento[]> {
    try {
      return await window.electronAPI.database.operation('getEventiByClienteAndDay', {
        cliente_id,
        date
      });
    } catch (error) {
      Logger.error('Error getting eventi by cliente and day:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero degli eventi del cliente per data',
        { originalError: error }
      );
    }
  }

  async getEventiByClienteInRange(
    cliente_id: string,
    start_date: Date,
    end_date: Date
  ): Promise<Evento[]> {
    try {
      return await window.electronAPI.database.operation('getEventiByClienteInRange', {
        cliente_id,
        start_date,
        end_date
      });
    } catch (error) {
      Logger.error('Error getting eventi by range:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero degli eventi del cliente per periodo',
        { originalError: error }
      );
    }
  }

  async getOverlappingEvents(params: EventOverlapParams): Promise<Evento[]> {
    try {
      return await window.electronAPI.database.operation('getOverlappingEvents', params);
    } catch (error) {
      Logger.error('Error getting overlapping events:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel controllo sovrapposizioni',
        { originalError: error }
      );
    }
  }

  async validateEventConstraints(
    eventData: Partial<Evento>,
    exclude_event_id: string | null = null
  ): Promise<DatabaseOperationResult<void>> {
    try {
      const result = await window.electronAPI.database.operation('validateEventConstraints', {
        eventData,
        exclude_event_id
      });
      return { success: result.isValid, error: result.error };
    } catch (error) {
      Logger.error('Error validating event constraints:', error);
      throw new AppError(
        ErrorCode.VALIDATION,
        'Errore nella validazione dell\'evento',
        { originalError: error }
      );
    }
  }

  async getClienteWorkload(
    cliente_id: string,
    start_date: string,
    end_date: string
  ): Promise<ClientWorkload[]> {
    try {
      return await window.electronAPI.database.operation('getClienteWorkload', {
        cliente_id,
        start_date,
        end_date
      });
    } catch (error) {
      Logger.error('Error getting cliente workload:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero del carico di lavoro cliente',
        { originalError: error }
      );
    }
  }

  async getCollectionAvailability(
    collezione_id: string,
    date: string
  ): Promise<CollectionAvailability[]> {
    try {
      return await window.electronAPI.database.operation('getCollectionAvailability', {
        collezione_id,
        date
      });
    } catch (error) {
      Logger.error('Error getting collection availability:', error);
      throw new AppError(
        ErrorCode.DB_QUERY,
        'Errore nel recupero della disponibilità collezione',
        { originalError: error }
      );
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
