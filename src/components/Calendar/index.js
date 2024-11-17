// src/components/Calendar/index.js
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/it';
import { useEventi, useCollezioni } from '../../hooks/useDatabase';
import CalendarHeader from './CalendarHeader';
import CalendarEvent from './CalendarEvent';
import EventModal from './EventModal';
import ValidationService from '../../services/validation.service';
import './Calendar.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

moment.locale('it');
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

const Calendar = () => {
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const { eventi, isLoading, error, updateEvento, createEvento, deleteEvento } = useEventi();
  const { collezioni } = useCollezioni();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalInitialDates, setModalInitialDates] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = useCallback((text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Formatta gli eventi per il calendario
  const calendarEvents = useMemo(() => {
    return eventi.map(evento => ({
      id: evento.id,
      title: `${evento.cliente_nome} - ${evento.collezione_nome}`,
      start: new Date(evento.data_inizio),
      end: new Date(evento.data_fine),
      cliente_id: evento.cliente_id,
      collezione_id: evento.collezione_id,
      cliente_nome: evento.cliente_nome,
      collezione_nome: evento.collezione_nome,
      note: evento.note,
      color: collezioni.find(c => c.id === evento.collezione_id)?.colore || '#4A90E2'
    }));
  }, [eventi, collezioni]);

  // Validazione evento
  const validateEvent = useCallback(async (eventData, excludeEventId = null) => {
    try {
      const validation = await window.electronAPI.database.operation(
        'validateEventConstraints',
        { eventData, excludeEventId }
      );

      if (!validation.isValid) {
        showMessage(validation.error, 'error');
        return false;
      }

      // Se ci sono warning, mostrali ma permetti di procedere
      if (validation.warnings?.length > 0) {
        validation.warnings.forEach(warning => {
          showMessage(warning, 'warning');
        });
      }

      return true;
    } catch (error) {
      showMessage('Errore durante la validazione', 'error');
      console.error('Validation error:', error);
      return false;
    }
  }, [showMessage]);

  // Gestione drag & drop
  const moveEvent = useCallback(async ({ event, start, end }) => {
    try {
      const eventData = {
        ...event,
        data_inizio: start,
        data_fine: end,
        cliente_id: event.cliente_id,
        collezione_id: event.collezione_id
      };

      const isValid = await validateEvent(eventData, event.id);
      if (!isValid) return;

      await updateEvento(event.id, eventData);
      showMessage('Evento spostato con successo', 'success');
    } catch (error) {
      showMessage('Errore nello spostamento dell\'evento', 'error');
      console.error('Move event error:', error);
    }
  }, [updateEvento, validateEvent, showMessage]);

  // Gestione resize evento
  const resizeEvent = useCallback(async ({ event, start, end }) => {
    try {
      const eventData = {
        ...event,
        data_inizio: start,
        data_fine: end,
        cliente_id: event.cliente_id,
        collezione_id: event.collezione_id
      };

      const isValid = await validateEvent(eventData, event.id);
      if (!isValid) return;

      await updateEvento(event.id, eventData);
      showMessage('Evento ridimensionato con successo', 'success');
    } catch (error) {
      showMessage('Errore nel ridimensionamento dell\'evento', 'error');
      console.error('Resize event error:', error);
    }
  }, [updateEvento, validateEvent, showMessage]);

  // Selezione slot vuoto
  const handleSelectSlot = useCallback(async ({ start, end }) => {
    // Reset stato validazione
    setValidationResults(null);
    
    // Verifica preliminare orari lavorativi
    const startHour = moment(start).hours();
    const endHour = moment(end).hours();
    const startDay = moment(start).day();
    
    if (startHour < 9 || endHour >= 18 || startDay === 0 || startDay === 6) {
      showMessage('Seleziona un orario valido (Lun-Ven, 9:00-18:00)', 'error');
      return;
    }

    // Controlla disponibilità slot
    try {
      const overlappingEvents = await window.electronAPI.database.operation(
        'getOverlappingEvents',
        { start_date: start, end_date: end }
      );

      if (overlappingEvents.length > 0) {
        showMessage('Questo slot è già occupato', 'error');
        return;
      }

      setModalInitialDates({ start, end });
      setShowModal(true);
    } catch (error) {
      showMessage('Errore nel controllo disponibilità', 'error');
      console.error('Slot selection error:', error);
    }
  }, [showMessage]);

  // Gestione salvataggio evento
  const handleSaveEvent = useCallback(async (eventData) => {
    try {
      const isValid = await validateEvent(
        eventData,
        selectedEvent?.id
      );

      if (!isValid) return;

      if (selectedEvent) {
        await updateEvento(selectedEvent.id, eventData);
        showMessage('Evento aggiornato con successo', 'success');
      } else {
        await createEvento(eventData);
        showMessage('Evento creato con successo', 'success');
      }

      setShowModal(false);
      setSelectedEvent(null);
      setModalInitialDates(null);
      setValidationResults(null);
    } catch (error) {
      showMessage('Errore nel salvataggio dell\'evento', 'error');
      console.error('Save event error:', error);
    }
  }, [createEvento, updateEvento, selectedEvent, showMessage, validateEvent]);

  // Selezione evento esistente
  const handleSelectEvent = useCallback(async (event) => {
    try {
      // Carica i dettagli completi dell'evento
      const eventDetails = await window.electronAPI.database.operation(
        'getEventoById',
        { id: event.id }
      );

      // Carica il carico di lavoro del cliente per il giorno
      const workload = await window.electronAPI.database.operation(
        'getClienteWorkload',
        { 
          cliente_id: event.cliente_id,
          start_date: moment(event.start).format('YYYY-MM-DD'),
          end_date: moment(event.start).format('YYYY-MM-DD')
        }
      );

      setSelectedEvent({ ...eventDetails, workload });
      setShowModal(true);
    } catch (error) {
      showMessage('Errore nel caricamento dei dettagli evento', 'error');
      console.error('Select event error:', error);
    }
  }, [showMessage]);

  const handleDeleteEvent = useCallback(async (eventId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      return;
    }

    try {
      await deleteEvento(eventId);
      showMessage('Evento eliminato con successo', 'success');
    } catch (error) {
      showMessage('Errore nell\'eliminazione dell\'evento', 'error');
      console.error('Delete event error:', error);
    }
  }, [deleteEvento, showMessage]);

  // Event style
  const eventStyleGetter = useCallback((event) => ({
    style: {
      backgroundColor: event.color,
      borderColor: event.color
    }
  }), []);

  if (isLoading) {
    return <div className="calendar-loading">Caricamento calendario...</div>;
  }

  if (error) {
    return <div className="calendar-error">Errore: {error}</div>;
  }

  return (
    <div className="calendar-container">
      {message && (
        <div className={`calendar-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        events={calendarEvents}
        view={view}
        date={date}
        onNavigate={setDate}
        onView={setView}
        onEventDrop={moveEvent}
        onEventResize={resizeEvent}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        resizable
        popup
        components={{
          toolbar: props => (
            <CalendarHeader
              {...props}
              view={view}
              date={date}
              onViewChange={setView}
              onNavigate={setDate}
            />
          ),
          event: props => (
            <CalendarEvent
              {...props}
              onDelete={handleDeleteEvent}
            />
          ),
        }}
        eventPropGetter={eventStyleGetter}
        messages={{
          today: 'Oggi',
          previous: 'Precedente',
          next: 'Successivo',
          month: 'Mese',
          week: 'Settimana',
          day: 'Giorno',
          agenda: 'Agenda',
          showMore: total => `+ Altri ${total}`,
        }}
        min={moment().hour(8).minute(0).toDate()}
        max={moment().hour(19).minute(0).toDate()}
        defaultView="week"
        views={['month', 'week', 'day']}
        step={30}
        timeslots={2}
      />

      {showModal && (
        <EventModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
            setModalInitialDates(null);
            setValidationResults(null);
          }}
          onSave={handleSaveEvent}
          event={selectedEvent}
          initialStart={modalInitialDates?.start}
          initialEnd={modalInitialDates?.end}
          validationResults={validationResults}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Calendar;
