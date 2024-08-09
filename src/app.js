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

  useEffect(() => {
    console.log('Clienti:', clienti);
    console.log('Collezioni:', collezioni);
    console.log('Eventi:', events);
  }, [clienti, collezioni, events]);

  const processCSV = (text) => {
    const [headers, ...rows] = text.split('\n').map(row => row.split(';').map(cell => cell.trim()));
    return rows.filter(row => row.length === headers.length).map(row => {
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
    collezioni.forEach(collezione => {
      const startDate = moment(collezione['Data Inizio'], 'DD/MM/YYYY');
      const endDate = moment(collezione['Data Fine'], 'DD/MM/YYYY');
      collectionDates[collezione.Collezioni] = { start: startDate, end: endDate };
    });

    console.log('Date delle collezioni:', collectionDates);

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
      console.log('Generazione eventi per cliente:', cliente.Nome);
      const clientCollections = cliente.collezioni.split(';').map(c => c.trim());
      
      clientCollections.forEach(collection => {
        console.log('Generazione eventi per collezione:', collection);
        const { start, end } = collectionDates[collection];
        if (!start || !end) {
          console.error('Date non trovate per la collezione:', collection);
          return;
        }
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
                console.log('Nuovo evento aggiunto:', newEvent);
                break; // Passa al prossimo giorno dopo aver aggiunto un evento
              }
            }
          }
          currentDate.add(1, 'days');
        }
      });
    });

    console.log('Eventi generati:', newEvents);
    setEvents(newEvents);
    setMessage(`Eventi generati: ${newEvents.length}`);
  };

  // ... (resto del codice invariato) ...

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
