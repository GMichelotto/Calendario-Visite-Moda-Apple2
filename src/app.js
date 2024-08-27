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

// Funzione per generare codici seriali
const generateSerialCode = () => {
  return Math.random().toString(36).substring(2, 15).toUpperCase();
};

function App() {
  const [events, setEvents] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [collezioni, setCollezioni] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isActivated, setIsActivated] = useState(false);
  const [serialCode, setSerialCode] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [serialCodes, setSerialCodes] = useState([]);
  
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
    // ... (codice esistente per processare CSV)
  };

  const handleFileUpload = async (event, fileType) => {
    // ... (codice esistente per caricare file)
  };

  const generateEvents = () => {
    // ... (codice esistente per generare eventi)
  };

  const handleSaveCalendar = () => {
    // ... (codice esistente per salvare il calendario)
  };

  const handleLoadCalendar = (event) => {
    // ... (codice esistente per caricare il calendario)
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    // ... (codice esistente per spostare eventi)
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    // ... (codice esistente per ridimensionare eventi)
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (updatedEvent) => {
    // ... (codice esistente per aggiornare eventi)
  };

  // Nuova funzione per la stampa del calendario
  const handlePrint = useReactToPrint({
    content: () => calendarRef.current,
  });

  const handleAdminLogin = () => {
    // In una vera applicazione, questa password dovrebbe essere crittografata e verificata in modo sicuro
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      setMessage('Accesso admin effettuato con successo');
    } else {
      setMessage('Password admin non valida');
    }
  };

  const handleGenerateCode = () => {
    const newCode = generateSerialCode();
    setSerialCodes(prev => [...prev, { code: newCode, isUsed: false }]);
    setMessage(`Nuovo codice generato: ${newCode}`);
  };

  const handleActivation = () => {
    const validCode = serialCodes.find(code => code.code === serialCode && !code.isUsed);
    if (validCode) {
      setIsActivated(true);
      setMessage('Applicazione attivata con successo!');
      // Marca il codice come usato
      setSerialCodes(prev => prev.map(code => 
        code.code === serialCode ? { ...code, isUsed: true } : code
      ));
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
        {!isActivated && !isAdmin ? (
          <div>
            <h2>Attivazione Applicazione</h2>
            <input 
              type="text" 
              value={serialCode}
              onChange={(e) => setSerialCode(e.target.value)}
              placeholder="Inserisci il codice seriale"
            />
            <button onClick={handleActivation} style={buttonStyle}>Attiva</button>
            <hr />
            <h3>Accesso Admin</h3>
            <input 
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Password Admin"
            />
            <button onClick={handleAdminLogin} style={buttonStyle}>Login Admin</button>
          </div>
        ) : isAdmin ? (
          <div>
            <h2>Pannello Admin</h2>
            <button onClick={handleGenerateCode} style={buttonStyle}>Genera Nuovo Codice</button>
            <h3>Codici Seriali:</h3>
            <ul>
              {serialCodes.map((code, index) => (
                <li key={index}>{code.code} - {code.isUsed ? 'Usato' : 'Non usato'}</li>
              ))}
            </ul>
            <button onClick={() => setIsAdmin(false)} style={buttonStyle}>Esci da Admin</button>
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
              <label htmlFor="clienti-upload" style={buttonStyle}>Carica CSV Clienti</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleFileUpload(e, 'collezioni')} 
                id="collezioni-upload"
              />
              <label htmlFor="collezioni-upload" style={buttonStyle}>Carica CSV Collezioni</label>
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
        {message && <div className="message">{message}</div>}
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
