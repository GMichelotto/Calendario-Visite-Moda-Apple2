// src/components/Clienti/ClientiPage.js
import React, { useState, useCallback } from 'react';
import { useClienti } from '../../hooks/useDatabase';
import ClientiList from './ClientiList';
import ClienteForm from './ClienteForm';
import './ClientiPage.css';

const ClientiPage = () => {
  const { 
    clienti, 
    isLoading, 
    error, 
    createCliente, 
    updateCliente, 
    deleteCliente 
  } = useClienti();

  const [showForm, setShowForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [message, setMessage] = useState(null);

  // Gestione messaggi temporanei
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Gestione apertura form per nuovo cliente
  const handleNewCliente = () => {
    setSelectedCliente(null);
    setShowForm(true);
  };

  // Gestione modifica cliente
  const handleEditCliente = (cliente) => {
    setSelectedCliente(cliente);
    setShowForm(true);
  };

  // Gestione eliminazione cliente
  const handleDeleteCliente = async (id) => {
    try {
      await deleteCliente(id);
      showMessage('Cliente eliminato con successo');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Gestione salvataggio cliente (creazione o modifica)
  const handleSaveCliente = async (clienteData) => {
    try {
      if (selectedCliente) {
        await updateCliente(selectedCliente.id, clienteData);
        showMessage('Cliente aggiornato con successo');
      } else {
        await createCliente(clienteData);
        showMessage('Cliente creato con successo');
      }
      setShowForm(false);
      setSelectedCliente(null);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Chiusura form
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedCliente(null);
  };

  // Gestione export CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Ragione Sociale',
      'Indirizzo',
      'CAP',
      'Città',
      'Provincia',
      'Regione',
      'Telefono',
      'Cellulare',
      'Email',
      'Sito Web',
      'Collezioni'
    ];

    const csvContent = [
      headers.join(';'),
      ...clienti.map(cliente => [
        cliente.ragione_sociale,
        cliente.indirizzo,
        cliente.cap,
        cliente.citta,
        cliente.provincia,
        cliente.regione,
        cliente.telefono,
        cliente.cellulare,
        cliente.email,
        cliente.sito_web,
        cliente.collezioni_nomi
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clienti.csv';
    link.click();
  }, [clienti]);

  return (
    <div className="clienti-page">
      {/* Header */}
      <div className="clienti-header">
        <h1>Gestione Clienti</h1>
        <div className="header-actions">
          <button 
            onClick={handleExportCSV} 
            className="button secondary"
            disabled={isLoading || clienti.length === 0}
          >
            Esporta CSV
          </button>
          <button 
            onClick={handleNewCliente} 
            className="button primary"
            disabled={isLoading}
          >
            Nuovo Cliente
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
          <p>Caricamento clienti...</p>
        </div>
      )}

      {/* Lista clienti */}
      {!error && !isLoading && (
        <ClientiList
          onEdit={handleEditCliente}
          onDelete={handleDeleteCliente}
        />
      )}

      {/* Form modale */}
      {showForm && (
        <ClienteForm
          cliente={selectedCliente}
          onSubmit={handleSaveCliente}
          onCancel={handleCloseForm}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ClientiPage;
