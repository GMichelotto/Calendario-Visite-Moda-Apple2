import React, { useState, useCallback } from 'react';
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

  const processCSV = (text) => {
    const [headers, ...rows] = text.split('\n').map(row => row.split(';').map(cell => cell.trim()));
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  };

  const handleFileUpload = async (event, fileType) => {
    const file = event.target.files[0];
    const text = await file.text();
    const data = processCSV(text);
    
    if (fileType === 'clienti') {
      setClienti(data);
    } else if (fileType === 'collezioni') {
      setCollezioni(data);
    }
  };

  const generateEvents = () => {
    if (clienti.length === 0 || collezioni.length === 0) {
      alert('Carica entrambi i file CSV prima di generare gli eventi.');
      return;
    }

    const newEvents = [];
    const collectionDates = {};

    // Preparare le date delle collezioni
    collezioni.forEach(collezione => {
      const startDate = moment(collezione['Data Inizio'], 'DD/MM/YYYY');
      const endDate = moment(collezione['Data Fine'], 'DD/MM/YYYY');
      collectionDates[collezione.Collezioni] = { start: startDate, end: endDate };
    });

    // Funzione per verificare sovrapposizioni
    const hasOverlap = (newEvent, existingEvents) => {
      return existingEvents.some(event => 
        (newEvent.start >= event.start && newEvent.start < event.end) ||
        (newEvent.end > event.start && newEvent.end <= event.end) ||
        (newEvent.start <= event.start && newEvent.end >= event.end)
      );
    };

    // Generare eventi per ogni cliente
    clienti.forEach(cliente => {
      const clientCollections = cliente.collezioni.split(';').map(c => c.trim());
      
      clientCollections.forEach(collection => {
        const { start, end } = collectionDates[collection];
        let currentDate = moment(start);

        while (currentDate.isSameOrBefore(end)) {
          if (currentDate.day() >= 1 && currentDate.day() <= 5) { // Lunedì a Venerdì
            const morningStart = moment(currentDate).hour(9);
            const afternoonStart = moment(currentDate).hour(14);

            for (let i = 0; i < 4; i++) { // 4 slot al giorno (2 mattina, 2 pomeriggio)
              const eventStart = i < 2 ? moment(morningStart).add(i * 2, 'hours') : moment(afternoonStart).add((i - 2) * 2, 'hours');
              const eventEnd = moment(eventStart).add(2, 'hours');

              const newEvent = {
                id: `${cliente.Nome}-${collection}-${eventStart.format()}`,
                title: `${cliente.Nome} - ${collection}`,
                start: eventStart.toDate(),
                end: eventEnd.toDate(),
                cliente: cliente.Nome,
                collezione: collection
              };

              if (!hasOverlap(newEvent, newEvents)) {
                newEvents.push(newEvent);
                break; // Passa al prossimo giorno dopo aver aggiunto un evento
              }
            }
          }
          currentDate.add(1, 'days');
        }
      });
    });

    // Ordinare gli eventi per data
    newEvents.sort((a, b) => a.start - b.start);

    setEvents(newEvents);
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => 
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      return updatedEvents;
    });
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => 
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      return updatedEvents;
    });
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
  };

  const handleSaveCalendar = () => {
    const dataStr = JSON.stringify(events);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'calendar_events.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleLoadCalendar = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const loadedEvents = JSON.parse(e.target.result);
      setEvents(loadedEvents.map(ev => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end)
      })));
    };
    reader.readAsText(file);
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
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            defaultView="week"
            views={['month', 'week', 'day']}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
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
