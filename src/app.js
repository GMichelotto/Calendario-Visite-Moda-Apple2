import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';

const localizer = momentLocalizer(moment);

function App() {
  const [csvFiles, setCsvFiles] = useState({ clients: null, collections: null });
  const [events, setEvents] = useState([]);

  const handleFileUpload = (event, fileType) => {
    const file = event.target.files[0];
    setCsvFiles(prev => ({ ...prev, [fileType]: file }));
  };

  const processCSV = async (file) => {
    const text = await file.text();
    return text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
  };

  const generateCalendar = async () => {
    if (!csvFiles.clients || !csvFiles.collections) {
      alert('Please upload both client and collection files');
      return;
    }

    const clientsData = await processCSV(csvFiles.clients);
    const collectionsData = await processCSV(csvFiles.collections);

    const generatedEvents = generateEvents(clientsData.slice(1), collectionsData.slice(1));
    setEvents(generatedEvents);
  };

  const generateEvents = (clients, collections) => {
    let events = [];
    let currentDate = new Date(2024, 0, 1); // Start from January 1, 2024

    clients.forEach((client, index) => {
      const [clientName, location, preferences] = client;
      const clientCollections = preferences.split(';').map(pref => pref.trim());
      
      clientCollections.forEach(collectionName => {
        const collection = collections.find(c => c[0] === collectionName);
        if (collection) {
          const [, duration] = collection;
          const startTime = new Date(currentDate);
          startTime.setHours(9 + index % 8); // Spread appointments throughout the day
          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + parseInt(duration));

          events.push({
            id: events.length,
            title: `${clientName} - ${collectionName}`,
            start: startTime,
            end: endTime,
            location: location
          });

          // Move to next day every 8 appointments
          if (events.length % 8 === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      });
    });

    return optimizeEvents(events);
  };

  const optimizeEvents = (events) => {
    // Group events by client
    const eventsByClient = events.reduce((acc, event) => {
      const clientName = event.title.split(' - ')[0];
      if (!acc[clientName]) acc[clientName] = [];
      acc[clientName].push(event);
      return acc;
    }, {});

    // Try to schedule client's events on the same day
    Object.values(eventsByClient).forEach(clientEvents => {
      if (clientEvents.length > 1) {
        const firstEventDate = new Date(clientEvents[0].start);
        clientEvents.slice(1).forEach(event => {
          const newStart = new Date(firstEventDate);
          newStart.setHours(newStart.getHours() + 1);
          const newEnd = new Date(newStart);
          newEnd.setMinutes(newStart.getMinutes() + (event.end - event.start));
          event.start = newStart;
          event.end = newEnd;
        });
      }
    });

    return Object.values(eventsByClient).flat();
  };

  const onEventDrop = ({ event, start, end }) => {
    const updatedEvents = events.map(ev => 
      ev.id === event.id ? { ...ev, start, end } : ev
    );
    setEvents(updatedEvents);
  };

  const onEventResize = ({ event, start, end }) => {
    const updatedEvents = events.map(ev => 
      ev.id === event.id ? { ...ev, start, end } : ev
    );
    setEvents(updatedEvents);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calendario Visite Moda</h1>
      </header>
      <main>
        <div className="file-upload">
          <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'clients')} />
          <label>Upload Clients CSV</label>
          <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'collections')} />
          <label>Upload Collections CSV</label>
        </div>
        <button onClick={generateCalendar}>Generate Calendar</button>
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            resizable
          />
        </div>
      </main>
    </div>
  );
}

export default App;
