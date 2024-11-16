// src/components/Collezioni/CollezioniPage.js
import React, { useState, useCallback } from 'react';
import { useCollezioni } from '../../hooks/useDatabase';
import CollezioniList from './CollezioniList';
import CollezioneForm from './CollezioneForm';
import './CollezioniPage.css';

const CollezioniPage = () => {
  const { 
    collezioni, 
    isLoading, 
    error, 
    createCollezione, 
    updateCollezione, 
    deleteCollezione 
  } = useCollezioni();

  const [showForm, setShowForm] = useState(false);
  const [selectedCollezione, setSelectedCollezione] = useState(null);
  const [message, setMessage] = useState(null);
  const [view, setView] = useState('grid'); // 'grid' o 'list'

  // Gestione messaggi temporanei
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Handle nuova collezione
  const handleNewCollezione = () => {
    setSelectedCollezione(null);
    setShowForm(true);
  };

  // Handle modifica collezione
  const handleEditCollezione = (collezione) => {
    setSelectedCollezione(collezione);
    setShowForm(true);
  };

  // Handle eliminazione collezione
  const handleDeleteCollezione = async (id) => {
    try {
      const collezione = collezioni.find(c => c.id === id);
      
      // Controllo se ci sono eventi associati
      if (collezione?.eventi_count > 0) {
        if (!window.confirm(
          `Questa collezione ha ${collezione.eventi_count} eventi associati. ` +
          'L\'eliminazione comporterà la cancellazione di tutti gli eventi. ' +
          'Vuoi procedere?'
        )) {
          return;
        }
      }

      await deleteCollezione(id);
      showMessage('Collezione eliminata con successo');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Handle salvataggio collezione
  const handleSaveCollezione = async (collezioneData) => {
    try {
      if (selectedCollezione) {
        await updateCollezione(selectedCollezione.id, collezioneData);
        showMessage('Collezione aggiornata con successo');
      } else {
        await createCollezione(collezioneData);
        showMessage('Collezione creata con successo');
      }
      setShowForm(false);
      setSelectedCollezione(null);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Nome',
      'Data Inizio',
      'Data Fine',
      'Clienti Associati',
      'Eventi Programmati',
      'Note'
    ];

    const csvContent = [
      headers.join(';'),
      ...collezioni.map(collezione => [
        collezione.nome,
        collezione.data_apertura,
        collezione.data_chiusura,
        collezione.clienti_count || 0,
        collezione.eventi_count || 0,
        collezione.note || ''
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'collezioni.csv';
    link.click();
  }, [collezioni]);

  // Handle download calendario
  const handleDownloadCalendario = useCallback(() => {
    // Implementare la generazione del PDF del calendario
    showMessage('Funzionalità in sviluppo', 'info');
  }, []);

  return (
    <div className="collezioni-page">
      {/* Header */}
      <div className="collezioni-header">
        <div className="header-title">
          <h1>Gestione Collezioni</h1>
          <div className="collezioni-stats">
            <span>Totale: {collezioni.length}</span>
            <span>•</span>
            <span>
              Attive: {
                collezioni.filter(c => 
                  new Date(c.data_chiusura) >= new Date()
                ).length
              }
            </span>
          </div>
        </div>

        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`view-button ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
              title="Vista griglia"
            >
              📱
            </button>
            <button 
              className={`view-button ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              title="Vista lista"
            >
              📋
            </button>
          </div>

          <button 
            onClick={handleExportCSV} 
            className="button outline"
            disabled={isLoading || collezioni.length === 0}
            title="Esporta in CSV"
          >
            📊 Esporta
          </button>
          
          <button 
            onClick={handleDownloadCalendario} 
            className="button outline"
            disabled={isLoading || collezioni.length === 0}
            title="Scarica calendario"
          >
            📅 Calendario
          </button>

          <button 
            onClick={handleNewCollezione} 
            className="button primary"
            disabled={isLoading}
          >
            + Nuova Collezione
          </button>
        </div>
      </div>

      {/* Messaggi di stato */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Errore generale */}
      {error && (
        <div className="error-container">
          <p>Si è verificato un errore: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="button secondary"
          >
            Ricarica pagina
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !error && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Caricamento collezioni...</p>
        </div>
      )}

      {/* Lista o Griglia collezioni */}
      {!error && !isLoading && (
        view === 'grid' ? (
          <div className="collezioni-grid">
            {collezioni.map(collezione => (
              <div 
                key={collezione.id} 
                className="collezione-card"
                style={{ borderColor: collezione.colore }}
              >
                <div className="collezione-card-header">
                  <h3>{collezione.nome}</h3>
                  <div className="card-actions">
                    <button
                      onClick={() => handleEditCollezione(collezione)}
                      className="icon-button"
                      title="Modifica collezione"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCollezione(collezione.id)}
                      className="icon-button"
                      title="Elimina collezione"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="collezione-card-content">
                  <p className="date-range">
                    {new Date(collezione.data_apertura).toLocaleDateString()} - 
                    {new Date(collezione.data_chiusura).toLocaleDateString()}
                  </p>
                  <div className="collezione-stats">
                    <span>👥 {collezione.clienti_count || 0} clienti</span>
                    <span>📅 {collezione.eventi_count || 0} eventi</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CollezioniList
            onEdit={handleEditCollezione}
            onDelete={handleDeleteCollezione}
          />
        )
      )}

      {/* Form modale */}
      {showForm && (
        <CollezioneForm
          collezione={selectedCollezione}
          onSubmit={handleSaveCollezione}
          onCancel={() => {
            setShowForm(false);
            setSelectedCollezione(null);
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default CollezioniPage;
