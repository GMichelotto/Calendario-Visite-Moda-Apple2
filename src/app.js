import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';
import './print.css';
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
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error("Il file CSV deve contenere almeno un'intestazione e una riga di dati.");
    }

    const [headers, ...rows] = lines.map(row => {
      const matches = row.match(/(".*?"|[^";]+)(?=\s*;|\s*$)/g) || [];
      return matches.map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
    });

    return rows.map(row => {
      if (row.length !== headers.length) {
        console.warn(`Riga con numero di colonne non corrispondente all'intestazione: ${row}`);
      }
      const obj = {};
      headers.forEach((header, index) => {
        if (fileType === 'clienti' && header === 'collezioni') {
          obj[header] = row[index] ? row[index].split(';').map(c => c.trim()) : [];
        } else {
          obj[header] = row[index] || '';
        }
      });
      return obj;
    });
  };

  const handleFileUpload = async (event, fileType) => {
    try {
      const file = event.target.files[0];
      const text = await file.text();
      const data = processCSV(text, fileType);
      
      if (fileType === 'clienti') {
        setClienti(data);
      } else if (fileType === 'collezioni') {
        setCollezioni(data);
      }
      
      setMessage(`${fileType} caricati: ${data.length}`);
    } catch (error) {
      setMessage(`Errore nel caricamento del file ${fileType}: ${error.message}`);
      console.error(`Errore nel caricamento del file ${fileType}:`, error);
    }
  };

  const generateEvents = () => {
    if (clienti.length === 0 || collezioni.length === 0) {
      setMessage('Carica entrambi i file CSV prima di generare gli eventi.');
      return;
    }

    const newEvents = [];
    const collectionDates = {};

    collezioni.forEach((collezione) => {
      const startDate = moment(collezione['Data Inizio'], 'DD/MM/YYYY');
      const endDate = moment(collezione['Data Fine'], 'DD/MM/YYYY');
      if (!startDate.isValid() || !endDate.isValid()) {
        console.error(`Date non valide per la collezione: ${collezione.Collezioni}`);
        return;
      }
      collectionDates[collezione.Collezioni] = { start: startDate, end: endDate };
    });

    const findNextAvailableSlot = (date, events) => {
      const workingHours = { start: 9, end: 18 };
      let attempts = 0;
      const maxAttempts = 1000;

      while (attempts < maxAttempts) {
        if (date.day() === 0 || date.day() === 6) {
          date.add(1, 'days').hour(workingHours.start).minute(0);
          continue;
        }

        if (date.hour() < workingHours.start) {
          date.hour(workingHours.start).minute(0);
        }

        const endTime = moment(date).add(2, 'hours');

        if (date.hour() >= workingHours.end || endTime.hour() > workingHours.end) {
          date.add(1, 'days').hour(workingHours.start).minute(0);
          continue;
        }

        const overlap = events.some(event => 
          (moment(event.start).isBefore(endTime) && moment(event.end).isAfter(date))
        );

        if (!overlap) {
          return date;
        }

        date.add(30, 'minutes');
        attempts++;
      }

      return null;
    };

    clienti.forEach((cliente) => {
      if (cliente.collezioni) {
        cliente.collezioni.forEach((collection) => {
          const dateRange = collectionDates[collection];
          if (!dateRange) {
            console.error(`Date non trovate per la collezione: ${collection}`);
            return;
          }
          
          let eventDate = moment(dateRange.start);
          eventDate = findNextAvailableSlot(eventDate, newEvents);
          
          if (!eventDate || eventDate.isAfter(dateRange.end)) {
            console.warn(`Non è possibile programmare un evento per ${cliente.Nome} - ${collection}`);
            return;
          }

          const eventEnd = moment(eventDate).add(2, 'hours');

          const newEvent = {
            id: `${cliente.Nome}-${collection}-${eventDate.format()}`,
            title: `${cliente.Nome} - ${collection}`,
            start: eventDate.toDate(),
            end: eventEnd.toDate(),
            cliente: cliente.Nome,
            collezione: collection
          };

          newEvents.push(newEvent);
        });
      }
    });

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
    setMessage(`Evento "${event.title}" spostato con successo`);
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => 
        ev.id === event.id ? { ...ev, start, end } : ev
      );
      return updatedEvents;
    });
    setMessage(`Evento "${event.title}" ridimensionato con successo`);
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

  const handlePrint = useCallback(() => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Per favore, abilita i popup per permettere la stampa');
    return;
  }

  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        console.log('Error accessing styleSheet', e);
        return '';
      }
    })
    .join('\n');

  const calendarHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Calendario Visite Moda - Stampa</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
        <style>
          ${styles}
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Roboto', sans-serif;
          }
          .print-container {
            width: 100%;
            height: 100vh;
          }
          .calendar-container {
            height: calc(100vh - 60px) !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <h1 style="text-align: center; margin: 10px 0; font-size: 16pt;">Calendario Visite Moda</h1>
          <div class="calendar-container">
            ${document.querySelector('.calendar-container').innerHTML}
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(calendarHtml);
  printWindow.document.close();
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
            style={{display: 'none'}}
          />
          <label htmlFor="clienti-upload" className="button">Carica CSV Clienti</label>
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => handleFileUpload(e, 'collezioni')} 
            id="collezioni-upload"
            style={{display: 'none'}}
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
          <button className="button" onClick={handlePrint}>Stampa Calendario</button>
        </div>
        {message && <div className="message">{message}</div>}
        <div className="calendar-container">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 250px)' }}
            defaultView="week"
            date={calendarDate}
            onNavigate={date => setCalendarDate(date)}
            views={['month', 'week', 'day']}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
            selectable
            onSelectEvent={handleSelectEvent}
            min={new Date(0, 0, 0, 6, 0, 0)}
            max={new Date(0, 0, 0, 20, 0, 0)}
            step={30}
            timeslots={2}
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
