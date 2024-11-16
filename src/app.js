// src/App.js
import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { ClientiPage } from './components/Clienti/ClientiPage';
import { CollezioniPage } from './components/Collezioni/CollezioniPage';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Inizializzazione dell'applicazione
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        // Inizializza il database e carica i dati iniziali
        await window.electronAPI.database.operation('initialize');
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'calendar':
        return <Calendar />;
      case 'clienti':
        return <ClientiPage />;
      case 'collezioni':
        return <CollezioniPage />;
      default:
        return <Calendar />;
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Caricamento applicazione...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Errore di inizializzazione</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Riprova</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <h1>Fashion Calendar</h1>
        </div>
        <nav className="nav-menu">
          <button
            className={`nav-item ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
            📅 Calendario
          </button>
          <button
            className={`nav-item ${currentView === 'clienti' ? 'active' : ''}`}
            onClick={() => setCurrentView('clienti')}
          >
            👥 Clienti
          </button>
          <button
            className={`nav-item ${currentView === 'collezioni' ? 'active' : ''}`}
            onClick={() => setCurrentView('collezioni')}
          >
            👔 Collezioni
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
