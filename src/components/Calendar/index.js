// src/components/Calendar/index.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer, View } from 'react-big-calendar';
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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  cliente_id: string;
  collezione_id: string;
  cliente_nome: string;
  collezione_nome: string;
  note?: string;
  color: string;
}

const CalendarComponent: React.FC = () => {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const { eventi, isLoading, error, updateEvento, createEvento, deleteEvento } = useEventi();
  const { collezioni } = useCollezioni();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalInitialDates, setModalInitialDates] = useState<{ start: Date; end: Date } | null>(null);
  const [validationResults, setValidationResults] = useState(null);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  // ... [resto del codice esistente rimane uguale] ...

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
        onView={setView as any}
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

export { CalendarComponent as Calendar };
export default CalendarComponent;
