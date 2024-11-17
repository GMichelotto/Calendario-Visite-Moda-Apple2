// src/components/Calendar/CalendarEvent.js
import React, { useState } from 'react';
import moment from 'moment';
import { useCollezioni } from '../../hooks/useDatabase';

const CalendarEvent = ({ event, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { collezioni } = useCollezioni();
  
  const collezione = collezioni.find(c => c.id === event.collezione_id);
  const duration = moment.duration(moment(event.end).diff(moment(event.start))).asMinutes();

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      onDelete(event.id);
    }
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`calendar-event ${isExpanded ? 'expanded' : ''}`}
      style={{
        borderLeft: `4px solid ${collezione?.colore || '#4A90E2'}`
      }}
    >
      <div className="event-header">
        <div className="event-title-container">
          <strong className="event-title">{event.title}</strong>
          <button 
            onClick={toggleExpand}
            className="expand-button"
            title={isExpanded ? 'Mostra meno' : 'Mostra più dettagli'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
        <button 
          onClick={handleDelete}
          className="delete-button"
          title="Elimina evento"
        >
          ×
        </button>
      </div>

      <div className="event-time">
        {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
        <span className="event-duration">({duration} min)</span>
      </div>

      {isExpanded && (
        <div className="event-details">
          <div className="detail-row">
            <span className="detail-label">Cliente:</span>
            <span className="detail-value">{event.cliente_nome}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Collezione:</span>
            <span 
              className="detail-value collezione-badge"
              style={{ backgroundColor: `${collezione?.colore}20` }}
            >
              {event.collezione_nome}
            </span>
          </div>
          {event.note && (
            <div className="detail-row">
              <span className="detail-label">Note:</span>
              <span className="detail-value note">{event.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;
