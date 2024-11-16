// src/components/Clienti/ClientiList.js
import React, { useState, useMemo } from 'react';
import { useClienti } from '../../hooks/useDatabase';
import './ClientiList.css';

const ClientiList = ({ onEdit, onDelete }) => {
  const { clienti, isLoading, error } = useClienti();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'ragione_sociale',
    direction: 'asc'
  });

  // Filtraggio e ordinamento clienti
  const filteredAndSortedClienti = useMemo(() => {
    let filtered = clienti.filter(cliente =>
      cliente.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.citta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.provincia?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [clienti, searchTerm, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  if (isLoading) {
    return <div className="clienti-loading">Caricamento clienti...</div>;
  }

  if (error) {
    return <div className="clienti-error">Errore: {error}</div>;
  }

  return (
    <div className="clienti-list-container">
      <div className="clienti-list-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca per nome, città o provincia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="total-count">
          Totale clienti: {filteredAndSortedClienti.length}
        </div>
      </div>

      <div className="clienti-table-container">
        <table className="clienti-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('ragione_sociale')}>
                Ragione Sociale
                {sortConfig.key === 'ragione_sociale' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => requestSort('citta')}>
                Città
                {sortConfig.key === 'citta' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => requestSort('provincia')}>
                Provincia
                {sortConfig.key === 'provincia' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Collezioni</th>
              <th>Contatti</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedClienti.map(cliente => (
              <tr key={cliente.id}>
                <td>{cliente.ragione_sociale}</td>
                <td>{cliente.citta}</td>
                <td>{cliente.provincia}</td>
                <td>
                  {cliente.collezioni_nomi ? (
                    <div className="collezioni-chips">
                      {cliente.collezioni_nomi.split(',').map((collezione, index) => (
                        <span key={index} className="collezione-chip">
                          {collezione.trim()}
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td>
                  <div className="contatti-info">
                    {cliente.telefono && (
                      <div className="contatto-item">
                        <span className="contatto-label">Tel:</span>
                        <span className="contatto-value">{cliente.telefono}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="contatto-item">
                        <span className="contatto-label">Email:</span>
                        <span className="contatto-value">{cliente.email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(cliente)}
                      className="edit-button"
                      title="Modifica cliente"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
                          onDelete(cliente.id);
                        }
                      }}
                      className="delete-button"
                      title="Elimina cliente"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientiList;
