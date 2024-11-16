// src/components/Calendar/CalendarHeader.js
import React from 'react';
import moment from 'moment';

const CalendarHeader = ({ 
  view, 
  date, 
  onViewChange, 
  onNavigate,
  views = ['month', 'week', 'day']
}) => {
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

  return (
    <div className="calendar-header">
      <div className="calendar-nav">
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
          >
            ←
          </button>
          <button 
            onClick={() => navigate('NEXT')}
            className="nav-button next"
          >
            →
          </button>
        </div>
        <span className="current-date">
          {moment(date).format('MMMM YYYY')}
        </span>
      </div>
      
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
    </div>
  );
};

export default CalendarHeader;
