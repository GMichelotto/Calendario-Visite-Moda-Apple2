import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './App.css';

const localizer = momentLocalizer(moment);

function App() {
  const [events, setEvents] = useState([]);

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
      handleClientiData(data);
    } else if (fileType === 'collezioni') {
      handleCollezioniData(data);
    }
  };

  const handleClientiData = (clientiData) => {
    // Salva i dati dei clienti nello stato se necessario
    console.log('Dati clienti:', clientiData);
  };

  const handleCollezioniData = (collezioniData) => {
    const newEvents = collezioniData.flatMap(collezione => {
      const startDate = moment(collezione['Data Inizio'], 'DD/MM/YYYY').toDate();
      const endDate = moment(collezione['Data Fine'], 'DD/MM/YYYY').toDate();
      
      // Crea un evento per ogni giorno nel range di date
      const events = [];
      let currentDate = moment(startDate);
      while (currentDate.isSameOrBefore(endDate)) {
        events.push({
          title: collezione['Collezioni'],
          start: currentDate.toDate(),
          end: currentDate.clone().add(1, 'hour').toDate(),
          allDay: false
        });
        currentDate.add(1, 'day');
      }
      return events;
    });

    setEvents(newEvents);
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
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            defaultView="month"
            views={['month', 'week', 'day']}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
