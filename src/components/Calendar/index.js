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
  const [message, setMessage] = useState(null);

  // Mostra messaggi temporanei
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

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
      color: collezioni.find(c => c.id === evento.collezione_id)?.colore || '#4A90E2'
    }));
  }, [eventi, collezioni]);

  // Validazione orari lavorativi
  const validateWorkingHours = (start, end) => {
    const startHour = moment(start).hours();
    const endHour = moment(end).hours();
    const endMinutes = moment(end).minutes();
    
    if (startHour < 9 || startHour >= 18 || endHour > 18 || (endHour === 18 && endMinutes > 0)) {
      showMessage('Gli appuntamenti possono essere programmati solo dalle 9:00 alle 18:00', 'error');
      return false;
    }
    return true;
  };

  // Validazione giorni lavorativi
  const validateWorkingDays = (start, end) => {
    const startDay = moment(start).day();
    const endDay = moment(end).day();
    
    if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
      showMessage('Gli appuntamenti possono essere programmati solo dal lunedì al venerdì', 'error');
      return false;
    }
    return true;
  };

  // Gestione drag & drop
  const moveEvent = useCallback(async ({ event, start, end }) => {
    try {
      if (!validateWorkingHours(start, end) || !validateWorkingDays(start, end)) {
        return;
      }

      // Mantieni la durata originale
      const originalDuration = moment(event.end).diff(moment(event.start), 'minutes');
      const newEnd = moment(start).add(originalDuration, 'minutes').toDate();

      await updateEvento(event.id, {
        ...event,
        data_inizio: start,
        data_fine: newEnd,
      });
      showMessage('Evento spostato con successo');
    } catch (err) {
      console.error('Errore nello spostamento evento:', err);
      showMessage(err.message, 'error');
    }
  }, [updateEvento]);

  // Gestione resize evento
  const resizeEvent = useCallback(async ({ event, start, end }) => {
    try {
      if (!validateWorkingHours(start, end) || !validateWorkingDays(start, end)) {
        return;
      }

      // Verifica la durata configurata
      const response = await window.electronAPI.database.operation(
        'getClienteCollezioneDuration',
        { 
          cliente_id: event.cliente_id, 
          collezione_id: event.collezione_id 
        }
      );

      const configuredDuration = response.success ? response.data : 120;
      const newDuration = moment(end).diff(moment(start), 'minutes');

      if (newDuration !== configuredDuration) {
        showMessage(`La durata dell'appuntamento deve essere di ${configuredDuration} minuti`, 'error');
        return;
      }

      await updateEvento(event.id, {
        ...event,
        data_inizio: start,
        data_fine: end,
      });
      showMessage('Evento aggiornato con successo');
    } catch (err) {
      console.error('Errore nel ridimensionamento evento:', err);
      showMessage(err.message, 'error');
    }
  }, [updateEvento]);

  // Gestione selezione slot vuoto
  const handleSelectSlot = useCallback(({ start, end }) => {
    if (!validateWorkingHours(start, end) || !validateWorkingDays(start, end)) {
      return;
    }

    setModalInitialDates({ start, end });
    setShowModal(true);
  }, []);

  // Gestione click su evento
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowModal(true);
  }, []);

  // Gestione salvataggio evento dal modal
  const handleSaveEvent = async (eventData) => {
    try {
      if (selectedEvent) {
        await updateEvento(selectedEvent.id, eventData);
        showMessage('Evento aggiornato con successo');
      } else {
        await createEvento(eventData);
        showMessage('Evento creato con successo');
      }
      setShowModal(false);
      setSelectedEvent(null);
      setModalInitialDates(null);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Custom toolbar component
  const CustomToolbar = useCallback(props => (
    <CalendarHeader
      {...props}
      view={view}
      date={date}
      onViewChange={setView}
      onNavigate={setDate}
    />
  ), [view, date]);

  // Custom event component
  const EventComponent = useCallback(props => (
    <CalendarEvent 
      {...props} 
      onDelete={async (id) => {
        try {
          await deleteEvento(id);
          showMessage('Evento eliminato con successo');
        } catch (err) {
          showMessage(err.message, 'error');
        }
      }} 
    />
  ), [deleteEvento]);

  // Custom event style
  const eventStyleGetter = useCallback((event) => {
    return {
      style: {
        backgroundColor: event.color,
        borderColor: event.color
      }
    };
  }, []);

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
          toolbar: CustomToolbar,
          event: EventComponent,
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
          }}
          onSave={handleSaveEvent}
          event={selectedEvent}
          initialStart={modalInitialDates?.start}
          initialEnd={modalInitialDates?.end}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Calendar;
