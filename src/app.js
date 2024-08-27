import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';
import EventModal from './EventModal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

function App() {
  const [events, setEvents] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [collezioni, setCollezioni] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    console.log('Clienti:', clienti);
    console.log('Collezioni:', collezioni);
    console.log('Eventi:', events);
  }, [clienti, collezioni, events]);

  useEffect(() => {
    if (events.length > 0) {
      const firstEventStart = moment(events[0].start);
      setCalendarDate(firstEventStart.toDate());
    }
  }, [events]);

  const processCSV = (text, fileType) => {
    // ... (il codice esistente rimane invariato)
  };

  const handleFileUpload = async (event, fileType) => {
    // ... (il codice esistente rimane invariato)
  };

  const generateEvents = () => {
    // ... (il codice esistente rimane invariato)
  };

  const handleSaveCalendar = () => {
    // ... (il codice esistente rimane invariato)
  };

  const handleLoadCalendar = (event) => {
    // ... (il codice esistente rimane invariato)
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    // ... (il codice esistente rimane invariato)
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    // ... (il codice esistente rimane invariato)
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (updatedEvent) => {
    // ... (il codice esistente rimane invariato)
  };

  const handlePrintCalendar = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calendario Visite Moda</h1>
      </header>
      <main>
        <div className="file-upload">
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => handleFileUpload(e, 'clienti')} 
            id="clienti-upload"
          />
          <label htmlFor="clienti-upload" className="button">Carica CSV Clienti</label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => handleFileUpload(e, 'collezioni')} 
            id="collezioni-upload"
          />
          <label htmlFor="collezioni-upload" className="button">Carica CSV Collezioni</label>
        </div>
        <div className="button-group">
          <button className="button" onClick={generateEvents}>Genera Eventi</button>
          <button className="button" onClick={handleSaveCalendar}>Salva Calendario</button>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleLoadCalendar} 
            id="load-calendar"
            style={{display: 'none'}}
          />
          <label htmlFor="load-calendar" className="button">Carica Calendario</label>
          <button className="button" onClick={handlePrintCalendar}>Stampa Calendario</button>
        </div>
        {message && <div className="message">{message}</div>}
        <div className="calendar-container">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            defaultView="week"
            date={calendarDate}
            onNavigate={date => setCalendarDate(date)}
            views={['month', 'week', 'day']}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
            selectable
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </main>
      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={handleCloseModal} 
          onUpdate={handleUpdateEvent}
          collezioni={collezioni}
        />
      )}
    </div>
  );
}

export default App;
