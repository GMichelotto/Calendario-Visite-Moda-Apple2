// src/components/Calendar/index.js
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/it';
import { useEventi } from '../../hooks/useDatabase';
import CalendarHeader from './CalendarHeader';
import CalendarEvent from './CalendarEvent';
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

  // Formatta gli eventi per react-big-calendar
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
    }));
  }, [eventi]);

  // Gestione drag & drop
  const moveEvent = useCallback(async ({ event, start, end }) => {
    try {
      await updateEvento(event.id, {
        ...event,
        data_inizio: start,
        data_fine: end,
      });
    } catch (err) {
      console.error('Errore nello spostamento evento:', err);
      // TODO: Mostrare notifica errore
    }
  }, [updateEvento]);

  // Gestione resize evento
  const resizeEvent = useCallback(async ({ event, start, end }) => {
    try {
      await updateEvento(event.id, {
        ...event,
        data_inizio: start,
        data_fine: end,
      });
    } catch (err) {
      console.error('Errore nel ridimensionamento evento:', err);
      // TODO: Mostrare notifica errore
    }
  }, [updateEvento]);

  // Gestione selezione slot vuoto
  const handleSelectSlot = useCallback(async ({ start, end }) => {
    // Qui potremmo aprire un modal per la creazione evento
    // Per ora solo un esempio base
    const isWorkingHours = (date) => {
      const hour = moment(date).hour();
      return (hour >= 9 && hour < 13) || (hour >= 14 && hour < 18);
    };

    const isWorkingDay = (date) => {
      const day = moment(date).day();
      return day !== 0 && day !== 6;
    };

    if (!isWorkingDay(start) || !isWorkingDay(end)) {
      alert('Gli eventi possono essere creati solo nei giorni lavorativi');
      return;
    }

    if (!isWorkingHours(start) || !isWorkingHours(end)) {
      alert('Gli eventi possono essere creati solo negli orari lavorativi (9-13, 14-18)');
      return;
    }

    // TODO: Aprire modal per creazione evento invece di questo prompt
    const title = prompt('Inserisci il titolo dell\'evento');
    if (title) {
      try {
        await createEvento({
          data_inizio: start,
          data_fine: end,
          cliente_id: 1, // TODO: Selezionare da modal
          collezione_id: 1, // TODO: Selezionare da modal
        });
      } catch (err) {
        console.error('Errore nella creazione evento:', err);
        // TODO: Mostrare notifica errore
      }
    }
  }, [createEvento]);

  // Gestione click su evento
  const handleSelectEvent = useCallback((event) => {
    // TODO: Aprire modal per visualizzazione/modifica evento
    console.log('Evento selezionato:', event);
  }, []);

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
    <CalendarEvent {...props} onDelete={deleteEvento} />
  ), [deleteEvento]);

  if (isLoading) {
    return <div className="calendar-loading">Caricamento calendario...</div>;
  }

  if (error) {
    return <div className="calendar-error">Errore: {error}</div>;
  }

  return (
    <div className="calendar-container">
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
    </div>
  );
};

export default Calendar;
