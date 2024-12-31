import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { ClientiPage } from './components/Clienti';  // Usa l'import dal barrel file
import CollezioniPage from './components/Collezioni/CollezioniPage';
import { ElectronAPI } from './types';  // Aggiornato per usare il barrel file
import './App.css';

// Extend the Window interface to include our electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

type ViewType = 'calendar' | 'clienti' | 'collezioni';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        setIsLoading(true);
        await window.electronAPI.database.operation('initialize');
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const renderContent = (): JSX.Element => {
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
        <button 
          onClick={() => window.location.reload()}
          className="error-retry-button"
        >
          Riprova
        </button>
      </div>
    );
  }

  const navItems: Array<{
    id: ViewType;
    label: string;
    icon: string;
  }> = [
    { id: 'calendar', label: 'Calendario', icon: '📅' },
    { id: 'clienti', label: 'Clienti', icon: '👥' },
    { id: 'collezioni', label: 'Collezioni', icon: '👔' }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <h1>Fashion Calendar</h1>
        </div>
        <nav className="nav-menu">
          {navItems.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`nav-item ${currentView === id ? 'active' : ''}`}
              onClick={() => setCurrentView(id)}
              aria-label={label}
            >
              {icon} {label}
            </button>
          ))}
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
