import moment from 'moment';
import { AppError, ErrorCode } from '../../types/errors';
import { DatabaseService } from './databaseServices';
import Logger from '../../utils/logger';
import type { Evento, ValidationResult } from '../../types/database';

interface TimeValidation {
  isValid: boolean;
  error?: string;
}

interface ValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface EventValidationData extends Partial<Evento> {
  data_inizio: string;
  data_fine: string;
  cliente_id: string;
  collezione_id: string;
}

class ValidationService {
  private db: DatabaseService;
  private logger: typeof Logger;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    this.logger = Logger;
  }

  async validateEvent(
    eventData: EventValidationData,
    excludeEventId: string | null = null
  ): Promise<ValidationResponse> {
    const validations: ValidationResult[] = [];

    try {
      // Validazione base degli orari
      const timeValidation = await this.validateTimeConstraints(eventData);
      validations.push(timeValidation);

      // Validazione sovrapposizioni
      const overlapValidation = await this.validateOverlaps(eventData, excludeEventId);
      validations.push(overlapValidation);

      // Validazione disponibilità cliente
      const clientValidation = await this.validateClientAvailability(eventData, excludeEventId);
      validations.push(clientValidation);

      // Validazione periodo collezione
      const collectionValidation = await this.validateCollectionPeriod(eventData);
      validations.push(collectionValidation);

      // Verifica durata visita
      const durationValidation = await this.validateVisitDuration(eventData);
      validations.push(durationValidation);

      // Combina i risultati delle validazioni
      const errors = validations
        .filter(v => !v.isValid)
        .map(v => v.error!)
        .filter(Boolean);

      const warnings = validations
        .filter(v => v.warning)
        .map(v => v.warning!)
        .filter(Boolean);

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      this.logger.error('Error in event validation:', error);
      throw new AppError(
        ErrorCode.VALIDATION,
        'Errore durante la validazione dell\'evento',
        { originalError: error }
      );
    }
  }

  private async validateTimeConstraints(
    { data_inizio, data_fine }: Pick<EventValidationData, 'data_inizio' | 'data_fine'>
  ): Promise<ValidationResult> {
    const start = moment(data_inizio);
    const end = moment(data_fine);
    
    // Controllo giorni lavorativi
    const isWorkingDay = (day: number): boolean => day >= 1 && day <= 5;
    if (!isWorkingDay(start.day()) || !isWorkingDay(end.day())) {
      return {
        isValid: false,
        error: 'Gli appuntamenti possono essere programmati solo dal lunedì al venerdì'
      };
    }

    // Controllo orari lavorativi (9:00-18:00)
    const isWorkingHour = (time: moment.Moment): boolean => {
      const hour = time.hour();
      const minute = time.minute();
      return (hour >= 9 && hour < 18) || (hour === 18 && minute === 0);
    };

    if (!isWorkingHour(start) || !isWorkingHour(end)) {
      return {
        isValid: false,
        error: 'Gli appuntamenti possono essere programmati solo dalle 9:00 alle 18:00'
      };
    }

    // Controllo stesso giorno
    if (!start.isSame(end, 'day')) {
      return {
        isValid: false,
        error: 'L\'appuntamento deve iniziare e finire nello stesso giorno'
      };
    }

    return { isValid: true };
  }

  private async validateOverlaps(
    { data_inizio, data_fine, cliente_id, collezione_id }: EventValidationData,
    excludeEventId: string | null
  ): Promise<ValidationResult> {
    const start = moment(data_inizio);
    const end = moment(data_fine);

    // Controlla sovrapposizioni generali
    const overlappingEvents = await this.db.getOverlappingEvents({
      start_date: start.toDate(),
      end_date: end.toDate(),
      exclude_event_id: excludeEventId
    });

    if (overlappingEvents.length > 0) {
      return {
        isValid: false,
        error: 'Esiste già un altro appuntamento in questo orario'
      };
    }

    // Controlla sovrapposizioni per lo stesso cliente
    const clientEvents = await this.db.getEventiByCliente(cliente_id);
    const hasClientOverlap = clientEvents.some(event => {
      if (event.id === excludeEventId) return false;
      
      const eventStart = moment(event.data_inizio);
      const eventEnd = moment(event.data_fine);
      
      return start.isBetween(eventStart, eventEnd, null, '[]') ||
             end.isBetween(eventStart, eventEnd, null, '[]') ||
             eventStart.isBetween(start, end, null, '[]') ||
             eventEnd.isBetween(start, end, null, '[]');
    });

    if (hasClientOverlap) {
      return {
        isValid: false,
        error: 'Il cliente ha già un altro appuntamento in questo orario'
      };
    }

    return { isValid: true };
  }

  private async validateClientAvailability(
    { cliente_id, data_inizio, data_fine }: EventValidationData,
    excludeEventId: string | null
  ): Promise<ValidationResult> {
    const start = moment(data_inizio);
    
    // Controlla il numero di appuntamenti del cliente nel giorno
    const clientDayEvents = await this.db.getEventiByClienteAndDay(
      cliente_id,
      start.format('YYYY-MM-DD')
    );

    // Filtriamo l'evento corrente se stiamo facendo un update
    const relevantEvents = excludeEventId 
      ? clientDayEvents.filter(e => e.id !== excludeEventId)
      : clientDayEvents;

    if (relevantEvents.length >= 2) {
      return {
        isValid: false,
        error: 'Il cliente ha già raggiunto il numero massimo di appuntamenti per questo giorno'
      };
    }

    // Controlla se il cliente ha altri appuntamenti vicini
    const nearbyEvents = await this.db.getEventiByClienteInRange(
      cliente_id,
      start.clone().subtract(2, 'hours').toDate(),
      moment(data_fine).add(2, 'hours').toDate()
    );

    if (nearbyEvents.length > 0) {
      return {
        isValid: true,
        warning: 'Attenzione: il cliente ha altri appuntamenti ravvicinati in questa giornata'
      };
    }

    return { isValid: true };
  }

  private async validateCollectionPeriod(
    { collezione_id, data_inizio, data_fine }: EventValidationData
  ): Promise<ValidationResult> {
    const start = moment(data_inizio);
    const end = moment(data_fine);

    try {
      const collezioni = await this.db.getCollezioni();
      const collezione = collezioni.find(c => c.id === collezione_id);

      if (!collezione) {
        return {
          isValid: false,
          error: 'Collezione non trovata'
        };
      }

      const collectionStart = moment(collezione.data_inizio);
      const collectionEnd = moment(collezione.data_fine);

      if (start.isBefore(collectionStart) || end.isAfter(collectionEnd)) {
        return {
          isValid: false,
          error: 'Le date devono essere comprese nel periodo della collezione'
        };
      }

      // Controllo se siamo vicini alla fine del periodo
      if (end.isAfter(collectionEnd.clone().subtract(2, 'days'))) {
        return {
          isValid: true,
          warning: 'Attenzione: l\'appuntamento è programmato negli ultimi giorni della collezione'
        };
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating collection period:', error);
      throw new AppError(
        ErrorCode.VALIDATION,
        'Errore nella validazione del periodo collezione',
        { originalError: error }
      );
    }
  }

  private async validateVisitDuration(
    { cliente_id, collezione_id, data_inizio, data_fine }: EventValidationData
  ): Promise<ValidationResult> {
    const duration = moment(data_fine).diff(moment(data_inizio), 'minutes');
    
    try {
      const configuredDuration = await this.db.getClienteCollezioneDuration(
        cliente_id,
        collezione_id
      );

      if (duration !== configuredDuration) {
        return {
          isValid: false,
          error: `La durata dell'appuntamento deve essere di ${configuredDuration} minuti`
        };
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating visit duration:', error);
      throw new AppError(
        ErrorCode.VALIDATION,
        'Errore nella validazione della durata visita',
        { originalError: error }
      );
    }
  }
}

export default ValidationService;
