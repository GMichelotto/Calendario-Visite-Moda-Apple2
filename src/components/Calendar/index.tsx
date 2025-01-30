import React, { useState, useCallback, useMemo } from 'react';
import { 
  Calendar as BigCalendar, 
  momentLocalizer, 
  View, 
  SlotInfo, 
  Event
} from 'react-big-calendar';
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/it';
import { useEventi, useCollezioni } from '../../hooks/useDatabase';
import CalendarHeader from './CalendarHeader';
import CalendarEventComponent from './CalendarEvent';
import EventModal from './EventModal';
import './calendar-override.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

moment.locale('it');
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(BigCalendar);

interface CalendarEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  cliente_id: number;
  collezione_id: number;
  cliente_nome: string;
  collezione_nome: string;
  note?: string;
  color: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

interface EventValidation {
  eventData: Partial<CalendarEvent>;
  excludeEventId?: number | null;
}

interface Message {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ModalDates {
  start: Date;
  end: Date;
}

interface EventWorkload {
  total_events: number;
  total_duration: number;
}

interface EventDetails extends CalendarEvent {
  workload: EventWorkload;
}

const CalendarComponent: React.FC = () => {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState<Date>(new Date());
  const { eventi, isLoading, error, updateEvento, createEvento, deleteEvento } = useEventi();
  const { collezioni } = useCollezioni();
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalInitialDates, setModalInitialDates] = useState<ModalDates | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

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
      color: collezioni.find(c => c.id === evento.collezione_id)?.colore || '#4A90E2'
    })) as CalendarEvent[];
  }, [eventi, collezioni]);

  const validateEvent = useCallback(async (
    eventData: Partial<CalendarEvent>,
    excludeEventId: number | null = null
  ): Promise<boolean> => {
    try {
      const validation: ValidationResult = await window.electronAPI.database.operation(
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

  const resizeEvent = useCallback(async ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
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

  const handleSelectSlot = useCallback(async (slotInfo: SlotInfo) => {
    setValidationResults(null);
    
    const startHour = moment(slotInfo.start).hours();
    const endHour = moment(slotInfo.end).hours();
    const startDay = moment(slotInfo.start).day();
    
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

  const handleSaveEvent = useCallback(async (eventData: Partial<CalendarEvent>) => {
    try {
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
      borderColor: event.color
    }
  }), []);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8 text-gray-600">Caricamento calendario...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-600">Errore: {error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {message && (
        <div className={`
          fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300
          ${message.type === 'error' ? 'bg-red-100 text-red-800' :
            message.type === 'success' ? 'bg-green-100 text-green-800' :
            message.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'}
        `}>
          {message.text}
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        events={calendarEvents}
        view={view}
        date={date}
        onNavigate={setDate}
        onView={setView as any}
        onEventDrop={moveEvent}
        onEventResize={resizeEvent}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        resizable
        popup
        components={{
          toolbar: (props) => (
            <CalendarHeader
              {...props}
              view={view}
              date={date}
              onViewChange={setView}
              onNavigate={setDate}
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

export { CalendarComponent as Calendar };
export default CalendarComponent;
