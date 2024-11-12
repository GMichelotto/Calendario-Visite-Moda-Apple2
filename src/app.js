import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

export default function App() {
  const [events, setEvents] = useState([]);
  const [clienti, setClienti] = useState([]);
  const [collezioni, setCollezioni] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);

  // Caricamento iniziale dei dati
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [clientiData, collezioniData, eventiData] = await Promise.all([
        window.electronAPI.database.operation('getClienti'),
        window.electronAPI.database.operation('getCollezioni'),
        window.electronAPI.database.operation('getEventi')
      ]);
      setClienti(clientiData || []);
      setCollezioni(collezioniData || []);
      setEvents(eventiData || []);
      showMessage('Dati caricati con successo', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleFileUpload = async (event, type) => {
    try {
      const file = event.target.files[0];
      const fileContents = await file.text();
      
      await window.electronAPI.database.operation(`add${type}FromCSV`, {
        data: fileContents
      });
      
      await loadInitialData();
      showMessage(`${type} caricati con successo`, 'success');
    } catch (error) {
      showMessage(`Errore nel caricamento del file ${type}: ${error.message}`, 'error');
    }
  };

  const generateEvents = async () => {
    if (clienti.length === 0 || collezioni.length === 0) {
      showMessage('Carica entrambi i file CSV prima di generare gli eventi.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await window.electronAPI.database.operation('generateEvents', {
        clienti,
        collezioni
      });
      await loadInitialData();
      showMessage('Eventi generati con successo', 'success');
    } catch (error) {
      showMessage(`Errore nella generazione degli eventi: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCalendar = async () => {
    try {
      await window.electronAPI.handleFiles.saveFile(
        JSON.stringify(events),
        'calendar_events.json'
      );
      showMessage('Calendario salvato con successo', 'success');
    } catch (error) {
      showMessage(`Errore nel salvataggio: ${error.message}`, 'error');
    }
  };

  const handleLoadCalendar = async (event) => {
    try {
      const file = event.target.files[0];
      const text = await file.text();
      const loadedEvents = JSON.parse(text);
      
      await window.electronAPI.database.operation('importEvents', {
        events: loadedEvents
      });
      
      await loadInitialData();
      showMessage('Calendario caricato con successo', 'success');
    } catch (error) {
      showMessage(`Errore nel caricamento del calendario: ${error.message}`, 'error');
    }
  };

  return (
    <div className="app-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Caricamento in corso...</p>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <button 
            className="menu-button"
            onClick={() => setOpenDrawer(!openDrawer)}
          >
            <span>☰</span>
          </button>
          <h1>Fashion Calendar</h1>
        </div>
      </header>

      {openDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setOpenDrawer(false)} />
          <div className="drawer open">
            <nav>
              <ul className="p-4">
                <li className="py-2">Clienti ({clienti.length})</li>
                <li className="py-2">Collezioni ({collezioni.length})</li>
                <li className="py-2">Eventi ({events.length})</li>
              </ul>
            </nav>
          </div>
        </>
      )}

      <main className="main-content">
        <div className="toolbar bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <input
              type="file"
              id="clienti-upload"
              className="hidden"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, 'clienti')}
            />
            <label htmlFor="clienti-upload" className="btn btn-primary">
              Carica CSV Clienti
            </label>

            <input
              type="file"
              id="collezioni-upload"
              className="hidden"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, 'collezioni')}
            />
            <label htmlFor="collezioni-upload" className="btn btn-primary">
              Carica CSV Collezioni
            </label>

            <button onClick={generateEvents} className="btn btn-primary">
              Genera Eventi
            </button>

            <button onClick={handleSaveCalendar} className="btn btn-primary">
              Salva Calendario
            </button>

            <input
              type="file"
              id="load-calendar"
              className="hidden"
              accept=".json"
              onChange={handleLoadCalendar}
            />
            <label htmlFor="load-calendar" className="btn btn-primary">
              Carica Calendario
            </label>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stats-card">
            <h3>Clienti Totali</h3>
            <p className="text-3xl font-bold">{clienti.length}</p>
          </div>
          <div className="stats-card">
            <h3>Collezioni Attive</h3>
            <p className="text-3xl font-bold">{collezioni.length}</p>
          </div>
          <div className="stats-card">
            <h3>Eventi Totali</h3>
            <p className="text-3xl font-bold">{events.length}</p>
          </div>
        </div>

        <div className="calendar-container">
          {/* Qui andrà il componente calendario personalizzato */}
        </div>
      </main>

      {message && (
        <div className={`toast ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
