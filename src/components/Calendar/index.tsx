import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Calendar as BigCalendar, 
  momentLocalizer, 
  View, 
  SlotInfo,
  Event,
  ToolbarProps,
  EventProps,
} from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { format, getHours, getDay } from 'date-fns';
import { useEventi, useCollezioni } from '../../hooks/useDatabase';
import CalendarHeader from './CalendarHeader';
import CalendarEventComponent from './CalendarEvent';
import EventModal from './EventModal';
import './calendar-override.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import {
  CalendarEvent,
  EventValidation,
  ValidationResult,
  Message,
  ModalDates,
  EventWorkload,
  EventDetails
} from '@shared/types/calendar';

const localizer = momentLocalizer(moment);

interface DragAndDropCalendarProps {
  localizer: typeof localizer;
  events: CalendarEvent[];
  view: View;
  date: Date;
  onNavigate: (date: Date) => void;
  onView: (view: View) => void;
  onEventDrop: (args: EventInteractionArgs<CalendarEvent>) => void;
  onEventResize: (args: EventInteractionArgs<CalendarEvent>) => void;
  onSelectSlot: (slotInfo: SlotInfo) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  selectable: boolean;
  resizable: boolean;
  popup: boolean;
  components: {
    toolbar: React.ComponentType<ToolbarProps>;
    event: React.ComponentType<EventProps<CalendarEvent>>;
  };
  eventPropGetter: (event: CalendarEvent) => { style: React.CSSProperties };
  messages: {
    today: string;
    previous: string;
    next: string;
    month: string;
    week: string;
    day: string;
    agenda: string;
    showMore: (total: number) => string;
  };
  min: Date;
  max: Date;
  defaultView: View;
  views: View[];
  step: number;
  timeslots: number;
}

interface EventFormData {
  cliente_id: string;
  collezione_id: string;
  data_inizio: string;
  data_fine: string;
  [key: string]: any;
}

interface CustomEvent extends Omit<EventDetails, 'cliente_id' | 'collezione_id'> {
  cliente_id: string;
  collezione_id: string;
}

interface ValidationResults extends ValidationResult {
  errors: string[];
  checks: string[];
}

const DnDCalendar = withDragAndDrop(BigCalendar) as React.ComponentType<DragAndDropCalendarProps>;

const CalendarComponent: React.FC = () => {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState<Date>(new Date());
  const { eventi, isLoading, error, updateEvento, createEvento, deleteEvento } = useEventi();
  const { collezioni } = useCollezioni();
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalInitialDates, setModalInitialDates] = useState<ModalDates | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [selectedCollezioni, setSelectedCollezioni] = useState<string[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);

  const showMessage = useCallback((text: string, type: Message['type'] = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const calendarEvents = useMemo(() => {
    return eventi.map(evento => ({
      id: Number(evento.id),
      title: `${evento.cliente_nome} - ${evento.collezione_nome}`,
      start: new Date(evento.data_inizio),
      end: new Date(evento.data_fine),
      cliente_id: Number(evento.cliente_id),
      collezione_id: Number(evento.collezione_id),
      cliente_nome: evento.cliente_nome,
      collezione_nome: evento.collezione_nome,
      note: evento.note,
      color: collezioni.find(c => c.id === evento.collezione_id)?.colore || '#4A90E2',
    })) as CalendarEvent[];
  }, [eventi, collezioni]);

  useEffect(() => {
    const newFilteredEvents = selectedCollezioni.length === 0 
      ? calendarEvents
      : calendarEvents.filter(event => 
          selectedCollezioni.includes(event.collezione_id.toString())
        );
    setFilteredEvents(newFilteredEvents);
  }, [calendarEvents, selectedCollezioni]);

  const validateEvent = useCallback(async (
    eventData: Partial<CalendarEvent>,
    excludeEventId: number | null = null
  ): Promise<boolean> => {
    try {
      const validation: ValidationResults = await window.electronAPI.database.operation(
        'validateEventConstraints',
        { eventData, excludeEventId } as EventValidation
      );

      if (!validation.isValid) {
        showMessage(validation.error || 'Errore di validazione', 'error');
        return false;
      }

      if (validation.warnings?.length) {
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

  const moveEvent = useCallback(async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    try {
      const eventData = {
        ...event,
        start: new Date(start), // Converti start in Date
        end: new Date(end), // Converti end in Date
        cliente_id: event.cliente_id,
        collezione_id: event.collezione_id,
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

  const resizeEvent = useCallback(async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    try {
      const eventData = {
        ...event,
        start: new Date(start), // Converti start in Date
        end: new Date(end), // Converti end in Date
        cliente_id: event.cliente_id,
        collezione_id: event.collezione_id,
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

  const handleSelectSlot = useCallback(async (slotInfo: SlotInfo) => {
    setValidationResults(null);
    
    const startHour = getHours(slotInfo.start);
    const endHour = getHours(slotInfo.end);
    const startDay = getDay(slotInfo.start);
    
    if (startHour < 9 || endHour >= 18 || startDay === 0 || startDay === 6) {
      showMessage('Seleziona un orario valido (Lun-Ven, 9:00-18:00)', 'error');
      return;
    }

    try {
      const overlappingEvents = await window.electronAPI.database.operation(
        'getOverlappingEvents',
        { 
          start_date: slotInfo.start, 
          end_date: slotInfo.end 
        }
      );

      if (overlappingEvents.length > 0) {
        showMessage('Questo slot è già occupato', 'error');
        return;
      }

      setModalInitialDates({ 
        start: slotInfo.start, 
        end: slotInfo.end 
      });
      setShowModal(true);
    } catch (error) {
      showMessage('Errore nel controllo disponibilità', 'error');
      console.error('Slot selection error:', error);
    }
  }, [showMessage]);

  const handleSaveEvent = useCallback(async (formData: EventFormData) => {
    try {
      const eventData: Partial<CalendarEvent> = {
        ...formData,
        cliente_id: Number(formData.cliente_id), // Converti cliente_id da string a number
        collezione_id: Number(formData.collezione_id), // Converti collezione_id da string a number
        start: new Date(formData.data_inizio), // Converti data_inizio da string a Date
        end: new Date(formData.data_fine), // Converti data_fine da string a Date
      };

      const isValid = await validateEvent(
        eventData,
        selectedEvent?.id || null
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

  const handleSelectEvent = useCallback(async (event: CalendarEvent) => {
    try {
      const eventDetails = await window.electronAPI.database.operation(
        'getEventoById',
        { id: event.id }
      );

      const workload = await window.electronAPI.database.operation(
        'getClienteWorkload',
        { 
          cliente_id: event.cliente_id,
          start_date: format(event.start, 'yyyy-MM-dd'),
          end_date: format(event.start, 'yyyy-MM-dd'),
        }
      );

      setSelectedEvent({ 
        ...eventDetails, 
        cliente_id: eventDetails.cliente_id.toString(), // Converti cliente_id da number a string
        collezione_id: eventDetails.collezione_id.toString(), // Converti collezione_id da number a string
        workload 
      });
      setShowModal(true);
    } catch (error) {
      showMessage('Errore nel caricamento dei dettagli evento', 'error');
      console.error('Select event error:', error);
    }
  }, [showMessage]);

  const handleDeleteEvent = useCallback(async (eventId: number) => {
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

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      borderColor: event.color,
    },
  }), []);

  const messageStyles = {
    error: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8 text-gray-600">Caricamento calendario...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-600">Errore: {error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${messageStyles[message.type]}`}>
          {message.text}
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        events={filteredEvents}
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
          toolbar: (props: ToolbarProps) => (
            <CalendarHeader
              {...props}
              view={view}
              date={date}
              onViewChange={(newView: View) => setView(newView)}
              onNavigate={setDate}
              onFilterChange={setSelectedCollezioni}
              selectedCollezioni={selectedCollezioni}
              views={['month', 'week', 'day', 'work_week']} // Passa un array di View
            />
          ),
          event: (props) => (
            <CalendarEventComponent
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
          showMore: (total) => `+ Altri ${total}`,
        }}
        min={new Date(new Date().setHours(8, 0, 0, 0))}
        max={new Date(new Date().setHours(19, 0, 0, 0))}
        defaultView="week"
        views={['month', 'week', 'day', 'work_week']} // Passa un array di View
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

export { CalendarComponent as Calendar };
export default CalendarComponent;
