import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';
import EventModal from './EventModal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useReactToPrint } from 'react-to-print';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// Lista di codici seriali validi (in una vera applicazione, questi sarebbero memorizzati in modo sicuro sul server)
const validSerialCodes = ['ABCD-1234', 'EFGH-5678', 'IJKL-9012'];

function App() {
  const [events, setEvents] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [collezioni, setCollezioni] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isActivated, setIsActivated] = useState(false);
  const [serialCode, setSerialCode] = useState('');
  
  const calendarRef = useRef();

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
    // ... (il resto del codice rimane invariato)
  };

  const handleFileUpload = async (event, fileType) => {
    // ... (il resto del codice rimane invariato)
  };

  const generateEvents = () => {
    // ... (il resto del codice rimane invariato)
  };

  const handleSaveCalendar = () => {
    // ... (il resto del codice rimane invariato)
  };

  const handleLoadCalendar = (event) => {
    // ... (il resto del codice rimane invariato)
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    // ... (il resto del codice rimane invariato)
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    // ... (il resto del codice rimane invariato)
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (updatedEvent) => {
    // ... (il resto del codice rimane invariato)
  };

  // Nuova funzione per la stampa del calendario
  const handlePrint = useReactToPrint({
    content: () => calendarRef.current,
  });

  // Nuova funzione per l'attivazione dell'applicazione
  const handleActivation = () => {
    if (validSerialCodes.includes(serialCode)) {
      setIsActivated(true);
      setMessage('Applicazione attivata con successo!');
    } else {
      setMessage('Codice seriale non valido. Riprova.');
    }
  };

  // Stile comune per i pulsanti
  const buttonStyle = {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '4px'
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calendario Visite Moda</h1>
      </header>
      <main>
        {!isActivated ? (
          <div>
            <h2>Attivazione Applicazione</h2>
            <input 
              type="text" 
              value={serialCode}
              onChange={(e) => setSerialCode(e.target.value)}
              placeholder="Inserisci il codice seriale"
            />
            <button onClick={handleActivation} style={buttonStyle}>Attiva</button>
          </div>
        ) : (
          <>
            <div className="file-upload">
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleFileUpload(e, 'clienti')} 
                id="clienti-upload"
              />
              <label htmlFor="clienti-upload">Carica CSV Clienti</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleFileUpload(e, 'collezioni')} 
                id="collezioni-upload"
              />
              <label htmlFor="collezioni-upload">Carica CSV Collezioni</label>
            </div>
            <button onClick={generateEvents} style={buttonStyle}>Genera Eventi</button>
            <button onClick={handleSaveCalendar} style={buttonStyle}>Salva Calendario</button>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleLoadCalendar} 
              id="load-calendar"
              style={{display: 'none'}}
            />
            <label htmlFor="load-calendar" style={{...buttonStyle, display: 'inline-block'}}>Carica Calendario</label>
            <button onClick={handlePrint} style={buttonStyle}>Stampa Calendario</button>
            {message && <div className="message">{message}</div>}
            <div className="calendar-container" ref={calendarRef}>
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
          </>
        )}
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
