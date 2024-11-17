// src/components/Calendar/CalendarEvent.js
import React, { useState } from 'react';
import moment from 'moment';
import { AlertTriangle, Clock, User, Calendar as CalendarIcon } from 'lucide-react';

const CalendarEvent = ({ event, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(event.id);
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const getValidationStatus = () => {
    const now = moment();
    const start = moment(event.start);
    const warnings = [];

    // Controlla se l'evento è vicino
    if (start.isSame(now, 'day')) {
      warnings.push('Evento programmato per oggi');
    } else if (start.diff(now, 'days') <= 2) {
      warnings.push('Evento nei prossimi 2 giorni');
    }

    // Controlla l'orario (primi/ultimi slot della giornata)
    const hour = start.hour();
    if (hour === 9) {
      warnings.push('Primo slot disponibile');
    } else if (hour >= 16) {
      warnings.push('Ultimo slot disponibile');
    }

    return warnings;
  };

  const warnings = getValidationStatus();
  const duration = moment.duration(moment(event.end).diff(moment(event.start))).asMinutes();

  return (
    <div 
      className={`calendar-event ${isExpanded ? 'expanded' : ''}`}
      style={{
        borderLeft: `4px solid ${event.color}`,
        backgroundColor: `${event.color}10`
      }}
    >
      <div className="event-header">
        <div className="event-title-container">
          <strong className="event-title">{event.title}</strong>
          {warnings.length > 0 && (
            <AlertTriangle 
              className="warning-icon" 
              size={16} 
              color="#f59e0b"
            />
          )}
          <button 
            onClick={handleExpand} 
            className="expand-button"
            title={isExpanded ? 'Mostra meno' : 'Mostra dettagli'}
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

      <div className="event-basic-info">
        <div className="time-info">
          <Clock size={14} />
          <span>
            {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
          </span>
          <span className="duration">({duration} min)</span>
        </div>
      </div>

      {isExpanded && (
        <div className="event-details">
          <div className="detail-row">
            <User size={14} />
            <span className="detail-label">Cliente:</span>
            <span className="detail-value">{event.cliente_nome}</span>
          </div>
          <div className="detail-row">
            <CalendarIcon size={14} />
            <span className="detail-label">Collezione:</span>
            <span 
              className="detail-value collection-tag"
              style={{ backgroundColor: `${event.color}20` }}
            >
              {event.collezione_nome}
            </span>
          </div>
          {event.note && (
            <div className="detail-row notes">
              <span className="detail-value">{event.note}</span>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="warnings">
              {warnings.map((warning, index) => (
                <div key={index} className="warning-message">
                  <AlertTriangle size={12} />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;
