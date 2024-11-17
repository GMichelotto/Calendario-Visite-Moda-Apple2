// src/components/Calendar/CalendarHeader.js
import React, { useState } from 'react';
import moment from 'moment';
import { useCollezioni } from '../../hooks/useDatabase';

const CalendarHeader = ({ 
  view, 
  date, 
  onViewChange, 
  onNavigate,
  onFilterChange,
  selectedCollezioni = [],
  views = ['month', 'week', 'day']
}) => {
  const { collezioni } = useCollezioni();
  const [showFilters, setShowFilters] = useState(false);

  const navigate = (action) => {
    const newDate = moment(date);
    
    switch (action) {
      case 'PREV':
        newDate.subtract(1, view);
        break;
      case 'NEXT':
        newDate.add(1, view);
        break;
      case 'TODAY':
        return onNavigate(new Date());
      default:
        break;
    }
    
    onNavigate(newDate.toDate());
  };

  const viewNames = {
    month: 'Mese',
    week: 'Settimana',
    day: 'Giorno',
  };

  const handleCollezioneToggle = (collezioneId) => {
    const newSelection = selectedCollezioni.includes(collezioneId)
      ? selectedCollezioni.filter(id => id !== collezioneId)
      : [...selectedCollezioni, collezioneId];
    
    onFilterChange(newSelection);
  };

  const formatDateRange = () => {
    const start = moment(date);
    let end = moment(date);
    
    switch (view) {
      case 'month':
        return start.format('MMMM YYYY');
      case 'week':
        end = moment(date).endOf('week');
        return `${start.format('D')} - ${end.format('D')} ${start.format('MMMM YYYY')}`;
      case 'day':
        return start.format('dddd, D MMMM YYYY');
      default:
        return start.format('MMMM YYYY');
    }
  };

  return (
    <div className="calendar-header">
      <div className="calendar-nav">
        <div className="nav-group">
          <button 
            onClick={() => navigate('TODAY')}
            className="nav-button today"
          >
            Oggi
          </button>
          <div className="nav-arrows">
            <button 
              onClick={() => navigate('PREV')}
              className="nav-button prev"
              aria-label="Precedente"
            >
              ←
            </button>
            <button 
              onClick={() => navigate('NEXT')}
              className="nav-button next"
              aria-label="Successivo"
            >
              →
            </button>
          </div>
        </div>

        <span className="current-date">
          {formatDateRange()}
        </span>

        <div className="header-actions">
          <div className="view-switcher">
            {views.map(v => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`view-button ${v === view ? 'active' : ''}`}
              >
                {viewNames[v]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-button ${showFilters ? 'active' : ''}`}
            title="Filtra collezioni"
          >
            <span className="filter-icon">🔍</span>
            {selectedCollezioni.length > 0 && (
              <span className="filter-count">{selectedCollezioni.length}</span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="collezioni-filter">
          <div className="filter-header">
            <h3>Filtra per collezione</h3>
            <div className="filter-actions">
              <button 
                onClick={() => onFilterChange([])}
                className="clear-filters"
                disabled={selectedCollezioni.length === 0}
              >
                Rimuovi filtri
              </button>
              <button 
                onClick={() => onFilterChange(collezioni.map(c => c.id))}
                className="select-all"
                disabled={selectedCollezioni.length === collezioni.length}
              >
                Seleziona tutte
              </button>
            </div>
          </div>
          <div className="collezioni-list">
            {collezioni.map(collezione => (
              <label 
                key={collezione.id} 
                className="collezione-checkbox"
                style={{ borderColor: collezione.colore }}
              >
                <input
                  type="checkbox"
                  checked={selectedCollezioni.includes(collezione.id)}
                  onChange={() => handleCollezioneToggle(collezione.id)}
                />
                <span 
                  className="collezione-name"
                  style={{ backgroundColor: `${collezione.colore}20` }}
                >
                  {collezione.nome}
                </span>
                <span className="collezione-count">
                  {/* Qui potresti aggiungere il conteggio degli eventi per questa collezione */}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarHeader;
