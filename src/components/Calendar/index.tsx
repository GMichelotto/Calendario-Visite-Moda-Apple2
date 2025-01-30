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

interface DragAndDropCalendarProps {
  localizer: any;
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
  components: any;
  eventPropGetter: any;
  messages: any;
  min: Date;
  max: Date;
  defaultView: View;
  views: View[];
  step: number;
  timeslots: number;
}

const DnDCalendar = withDragAndDrop(BigCalendar) as React.ComponentType<DragAndDropCalendarProps>;

// ... resto delle interfacce ...
[... RESTO DEL FILE IDENTICO A PRIMA FINO A return ...]

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
