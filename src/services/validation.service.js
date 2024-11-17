// src/services/validation.service.js
import moment from 'moment';

class ValidationService {
  constructor(databaseService) {
    this.db = databaseService;
  }

  async validateEvent(eventData, excludeEventId = null) {
    const validations = [];

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
        .map(v => v.error);

      return {
        isValid: errors.length === 0,
        errors,
        warnings: validations
          .filter(v => v.warning)
          .map(v => v.warning)
      };
    } catch (error) {
      console.error('Error in event validation:', error);
      throw error;
    }
  }

  async validateTimeConstraints({ data_inizio, data_fine }) {
    const start = moment(data_inizio);
    const end = moment(data_fine);
    
    // Controllo giorni lavorativi
    const isWorkingDay = day => day >= 1 && day <= 5;
    if (!isWorkingDay(start.day()) || !isWorkingDay(end.day())) {
      return {
        isValid: false,
        error: 'Gli appuntamenti possono essere programmati solo dal lunedì al venerdì'
      };
    }

    // Controllo orari lavorativi (9:00-18:00)
    const isWorkingHour = time => {
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

  async validateOverlaps({ data_inizio, data_fine, cliente_id, collezione_id }, excludeEventId) {
    const start = moment(data_inizio);
    const end = moment(data_fine);

    // Controlla sovrapposizioni generali
    const hasOverlap = await this.db.validateEventOverlap(
      start.toDate(),
      end.toDate(),
      excludeEventId
    );

    if (hasOverlap) {
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

  async validateClientAvailability({ cliente_id, data_inizio, data_fine }) {
    const start = moment(data_inizio);
    
    // Controlla il numero di appuntamenti del cliente nel giorno
    const clientDayEvents = await this.db.getEventiByClienteAndDay(
      cliente_id,
      start.format('YYYY-MM-DD')
    );

    if (clientDayEvents.length >= 2) {
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

  async validateCollectionPeriod({ collezione_id, data_inizio, data_fine }) {
    const start = moment(data_inizio);
    const end = moment(data_fine);

    // Verifica che le date rientrino nel periodo della collezione
    const isValidDate = await this.db.validateCollezioneDate(
      collezione_id,
      start.toDate()
    );

    if (!isValidDate) {
      return {
        isValid: false,
        error: 'Le date devono essere comprese nel periodo della collezione'
      };
    }

    // Controlla se siamo vicini alla fine del periodo della collezione
    const collezione = await this.db.getCollezioneById(collezione_id);
    const collectionEnd = moment(collezione.data_chiusura);
    
    if (end.isAfter(collectionEnd.clone().subtract(2, 'days'))) {
      return {
        isValid: true,
        warning: 'Attenzione: l\'appuntamento è programmato negli ultimi giorni della collezione'
      };
    }

    return { isValid: true };
  }

  async validateVisitDuration({ cliente_id, collezione_id, data_inizio, data_fine }) {
    const duration = moment(data_fine).diff(moment(data_inizio), 'minutes');
    
    // Ottieni la durata configurata per questo cliente/collezione
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
  }
}

export default ValidationService;
