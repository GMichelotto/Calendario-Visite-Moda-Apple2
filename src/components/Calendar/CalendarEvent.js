// src/components/Calendar/CalendarEvent.js
import React from 'react';
import moment from 'moment';

const CalendarEvent = ({ event, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      onDelete(event.id);
    }
  };

  return (
    <div className="calendar-event">
      <div className="event-header">
        <strong className="event-title">{event.title}</strong>
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
      </div>
    </div>
  );
};

export default CalendarEvent;
