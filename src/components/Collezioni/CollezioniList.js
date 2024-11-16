// src/components/Collezioni/CollezioniList.js
import React, { useState, useMemo } from 'react';
import { useCollezioni } from '../../hooks/useDatabase';
import moment from 'moment';
import './CollezioniList.css';

const CollezioniList = ({ onEdit, onDelete }) => {
  const { collezioni, isLoading, error } = useCollezioni();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'data_apertura',
    direction: 'desc'
  });

  // Filtraggio e ordinamento collezioni
  const filteredAndSortedCollezioni = useMemo(() => {
    let filtered = collezioni.filter(collezione =>
      collezione.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case 'data_apertura':
        case 'data_chiusura':
          comparison = moment(a[sortConfig.key]).unix() - moment(b[sortConfig.key]).unix();
          break;
        default:
          if (a[sortConfig.key] < b[sortConfig.key]) comparison = -1;
          if (a[sortConfig.key] > b[sortConfig.key]) comparison = 1;
          break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [collezioni, searchTerm, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: 
        prevConfig.key === key && prevConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc',
    }));
  };

  const getCollezioneStatus = (collezione) => {
    const now = moment();
    const start = moment(collezione.data_apertura);
    const end = moment(collezione.data_chiusura);

    if (now.isBefore(start)) return 'upcoming';
    if (now.isAfter(end)) return 'completed';
    return 'active';
  };

  const formatDate = (date) => moment(date).format('DD/MM/YYYY');

  if (isLoading) {
    return <div className="collezioni-loading">Caricamento collezioni...</div>;
  }

  if (error) {
    return <div className="collezioni-error">Errore: {error}</div>;
  }

  return (
    <div className="collezioni-list-container">
      <div className="collezioni-list-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca collezione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="collezioni-stats">
          <div className="stat-item">
            <span className="stat-label">Totale:</span>
            <span className="stat-value">{collezioni.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Attive:</span>
            <span className="stat-value">
              {collezioni.filter(c => getCollezioneStatus(c) === 'active').length}
            </span>
          </div>
        </div>
      </div>

      <div className="collezioni-table-container">
        <table className="collezioni-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('nome')}>
                Nome
                {sortConfig.key === 'nome' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => requestSort('data_apertura')}>
                Data Inizio
                {sortConfig.key === 'data_apertura' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => requestSort('data_chiusura')}>
                Data Fine
                {sortConfig.key === 'data_chiusura' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Stato</th>
              <th>Clienti</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCollezioni.map(collezione => {
              const status = getCollezioneStatus(collezione);
              return (
                <tr key={collezione.id}>
                  <td>
                    <div className="collezione-name">
                      <span 
                        className="color-dot"
                        style={{ backgroundColor: collezione.colore }}
                      />
                      {collezione.nome}
                    </div>
                  </td>
                  <td>{formatDate(collezione.data_apertura)}</td>
                  <td>{formatDate(collezione.data_chiusura)}</td>
                  <td>
                    <span className={`status-badge ${status}`}>
                      {status === 'upcoming' && 'In Arrivo'}
                      {status === 'active' && 'Attiva'}
                      {status === 'completed' && 'Completata'}
                    </span>
                  </td>
                  <td>
                    <span className="clienti-count">
                      {collezione.clienti_count || 0} clienti
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => onEdit(collezione)}
                        className="edit-button"
                        title="Modifica collezione"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Sei sicuro di voler eliminare questa collezione?')) {
                            onDelete(collezione.id);
                          }
                        }}
                        className="delete-button"
                        title="Elimina collezione"
                        disabled={status === 'active'}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CollezioniList;
