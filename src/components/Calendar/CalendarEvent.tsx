import React, { useState } from 'react';
import moment from 'moment';
import { AlertTriangle, Clock, User, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarEvent as ICalendarEvent, Warning } from '@shared/types/calendar';

interface CalendarEventProps {
  event: ICalendarEvent;
  onDelete: (id: number) => void;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({ event, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete(event.id);
  };

  const handleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const getValidationStatus = (): Warning[] => {
    const now = moment();
    const start = moment(event.start);
    const warnings: Warning[] = [];

    // Controlla se l'evento è vicino
    if (start.isSame(now, 'day')) {
      warnings.push({
        message: 'Evento programmato per oggi',
        type: 'urgent'
      });
    } else if (start.diff(now, 'days') <= 2) {
      warnings.push({
        message: 'Evento nei prossimi 2 giorni',
        type: 'warning'
      });
    }

    // Controlla l'orario (primi/ultimi slot della giornata)
    const hour = start.hour();
    if (hour === 9) {
      warnings.push({
        message: 'Primo slot disponibile',
        type: 'info'
      });
    } else if (hour >= 16) {
      warnings.push({
        message: 'Ultimo slot disponibile',
        type: 'warning'
      });
    }

    return warnings;
  };

  const warnings = getValidationStatus();
  const duration = moment.duration(moment(event.end).diff(moment(event.start))).asMinutes();

  return (
    <div 
      className={`
        relative flex flex-col p-2 rounded-lg shadow-sm transition-all
        ${isExpanded ? 'min-h-32' : 'min-h-16'}
        hover:shadow-md
      `}
      style={{
        borderLeft: `4px solid ${event.color}`,
        backgroundColor: `${event.color}10`
      }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 flex items-start gap-2">
          <strong className="text-sm font-medium line-clamp-2">{event.title}</strong>
          {warnings.length > 0 && (
            <AlertTriangle 
              className="flex-shrink-0 text-amber-500"
              size={16}
            />
          )}
          <button 
            onClick={handleExpand} 
            className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
            title={isExpanded ? 'Mostra meno' : 'Mostra dettagli'}
          >
            <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
          </button>
        </div>
        <button
          onClick={handleDelete}
          className="flex-shrink-0 p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Elimina evento"
        >
          ×
        </button>
      </div>

      <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
        <Clock size={14} className="flex-shrink-0" />
        <span>
          {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
        </span>
        <span className="text-gray-400">({duration} min)</span>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User size={14} className="flex-shrink-0 text-gray-500" />
            <span className="text-gray-500">Cliente:</span>
            <span className="font-medium">{event.cliente_nome}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="flex-shrink-0 text-gray-500" />
            <span className="text-gray-500">Collezione:</span>
            <span 
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: `${event.color}20` }}
            >
              {event.collezione_nome}
            </span>
          </div>
          
          {event.note && (
            <div className="mt-2 text-xs text-gray-600 italic">
              {event.note}
            </div>
          )}
          
          {warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {warnings.map((warning, index) => (
                <div 
                  key={index} 
                  className={`
                    flex items-center gap-1 text-xs rounded px-2 py-1
                    ${warning.type === 'urgent' ? 'bg-red-50 text-red-700' : 
                      warning.type === 'warning' ? 'bg-amber-50 text-amber-700' : 
                      'bg-blue-50 text-blue-700'}
                  `}
                >
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  <span>{warning.message}</span>
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
