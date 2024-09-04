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
    // ... (il codice per processCSV rimane invariato)
  };

  const handleFileUpload = async (event, fileType) => {
    // ... (il codice per handleFileUpload rimane invariato)
  };

  const generateEvents = () => {
    // ... (il codice per generateEvents rimane invariato)
  };

  const handleSaveCalendar = () => {
    // ... (il codice per handleSaveCalendar rimane invariato)
  };

  const handleLoadCalendar = (event) => {
    // ... (il codice per handleLoadCalendar rimane invariato)
  };

  const onEventDrop = useCallback(({ event, start, end }) => {
    // ... (il codice per onEventDrop rimane invariato)
  }, []);

  const onEventResize = useCallback(({ event, start, end }) => {
    // ... (il codice per onEventResize rimane invariato)
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (updatedEvent) => {
    // ... (il codice per handleUpdateEvent rimane invariato)
  };

  const handlePrintCalendar = useCallback(() => {
    const printContent = document.querySelector('.calendar-container');
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
        } catch (e) {
          console.log('Error accessing styleSheet', e);
          return '';
        }
      })
      .join('\n');

    const windowPrint = window.open('', '', 'width=1000,height=600');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Anteprima di Stampa - Calendario Visite Moda</title>
          <style>
            ${styles}
            body {
              font-family: Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .calendar-container {
              width: 100%;
              height: calc(100vh - 100px);
            }
            .print-controls {
              margin-bottom: 20px;
            }
            @media print {
              .print-controls {
                display: none;
              }
              .calendar-container {
                height: 100vh;
              }
              @page {
                size: landscape;
              }
            }
            .rbc-calendar {
              height: 100% !important;
            }
            .rbc-time-view, .rbc-month-view {
              height: 100% !important;
            }
          </style>
        </head>
        <body>
          <div class="print-controls">
            <button onclick="window.print()">Stampa</button>
            <button onclick="window.close()">Chiudi</button>
          </div>
          <div class="calendar-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              const calendar = document.querySelector('.rbc-calendar');
              if (calendar) {
                calendar.style.height = '100%';
              }
            };
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
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
          <button className="button" onClick={handlePrintCalendar}>Stampa Calendario</button>
        </div>
        {message && <div className="message">{message}</div>}
        <div className="calendar-container">
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 200px)' }}
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
