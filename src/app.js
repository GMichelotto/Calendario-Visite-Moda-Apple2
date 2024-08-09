import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';
import EventModal from './EventModal';

const localizer = momentLocalizer(moment);

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

  const processCSV = (text) => {
    const [headers, ...rows] = text.split('\n').map(row => row.split(';').map(cell => cell.trim()));
    return rows.filter(row => row.some(cell => cell !== '')).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  };

  const handleFileUpload = async (event, fileType) => {
    try {
      const file = event.target.files[0];
      const text = await file.text();
      const data = processCSV(text);
      
      if (fileType === 'clienti') {
        setClienti(data);
        setMessage(`Clienti caricati: ${data.length}`);
      } else if (fileType === 'collezioni') {
        setCollezioni(data);
        setMessage(`Collezioni caricate: ${data.length}`);
      }
      console.log(`${fileType} caricati:`, data);
    } catch (error) {
      setMessage(`Errore nel caricamento del file ${fileType}: ${error.message}`);
      console.error(`Errore nel caricamento del file ${fileType}:`, error);
    }
  };

  const generateEvents = () => {
    console.log('Inizio generazione eventi');
    setMessage('Inizio generazione eventi...');
    if (clienti.length === 0 || collezioni.length === 0) {
      setMessage('Carica entrambi i file CSV prima di generare gli eventi.');
      return;
    }

    const newEvents = [];
    const collectionDates = {};

    // Preparare le date delle collezioni
    collezioni.forEach((collezione) => {
      const startDate = moment(collezione['Data Inizio'], 'DD/MM/YYYY');
      const endDate = moment(collezione['Data Fine'], 'DD/MM/YYYY');
      if (!startDate.isValid() || !endDate.isValid()) {
        console.error(`Date non valide per la collezione: ${collezione.Collezioni}`);
        return;
      }
      collectionDates[collezione.Collezioni] = { start: startDate, end: endDate };
    });

    console.log('Date delle collezioni:', collectionDates);

    // Generare eventi per ogni cliente
    clienti.forEach((cliente) => {
      console.log(`Generazione eventi per cliente:`, cliente.Nome);
      const clientCollections = cliente.collezioni.split(';').map(c => c.trim());
      
      clientCollections.forEach((collection) => {
        console.log(`Generazione evento per collezione:`, collection);
        const dateRange = collectionDates[collection];
        if (!dateRange) {
          console.error(`Date non trovate per la collezione: ${collection}`);
          return;
        }
        
        const eventStart = moment(dateRange.start).hour(9).minute(0);
        const eventEnd = moment(eventStart).add(2, 'hours');

        const newEvent = {
          id: `${cliente.Nome}-${collection}`,
          title: `${cliente.Nome} - ${collection}`,
          start: eventStart.toDate(),
          end: eventEnd.toDate(),
          cliente: cliente.Nome,
          collezione: collection
        };

        newEvents.push(newEvent);
        console.log('Nuovo evento aggiunto:', newEvent);
      });
    });

    console.log('Eventi generati:', newEvents);
    setEvents(newEvents);
    setMessage(`Eventi generati: ${newEvents.length}`);
  };

  const handleSaveCalendar = () => {
    const dataStr = JSON.stringify(events);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'calendar_events.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setMessage('Calendario salvato con successo');
  };

  const handleLoadCalendar = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedEvents = JSON.parse(e.target.result);
        setEvents(loadedEvents.map(ev => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end)
        })));
        setMessage('Calendario caricato con successo');
      } catch (error) {
        setMessage(`Errore nel caricamento del calendario: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => 
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      return updatedEvents;
    });
    setMessage('Evento spostato con successo');
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => 
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      return updatedEvents;
    });
    setMessage('Evento ridimensionato con successo');
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (updatedEvent) => {
    setEvents(prevEvents => 
      prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev)
    );
    setSelectedEvent(null);
    setMessage('Evento aggiornato con successo');
  };

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
          <label htmlFor="clienti-upload">Carica CSV Clienti</label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => handleFileUpload(e, 'collezioni')} 
            id="collezioni-upload"
          />
          <label htmlFor="collezioni-upload">Carica CSV Collezioni</label>
        </div>
        <button onClick={generateEvents}>Genera Eventi</button>
        <button onClick={handleSaveCalendar}>Salva Calendario</button>
        <input 
          type="file" 
          accept=".json" 
          onChange={handleLoadCalendar} 
          id="load-calendar"
          style={{display: 'none'}}
        />
        <label htmlFor="load-calendar">Carica Calendario</label>
        {message && <div className="message">{message}</div>}
        <div className="calendar-container">
          <Calendar
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
            draggableAccessor={() => true}
            onSelectEvent={handleSelectEvent}
          />
        </div>
      </main>
      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={handleCloseModal} 
          onUpdate={handleUpdateEvent}
        />
      )}
    </div>
  );
}

export default App;
