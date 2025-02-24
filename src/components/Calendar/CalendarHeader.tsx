import React, { useState } from 'react';
import { View } from 'react-big-calendar';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useCollezioni } from '../../hooks/useDatabase';
import { Collezione } from '@shared/types/calendar';

interface CalendarHeaderProps {
  view: View;
  date: Date;
  onViewChange: (view: View) => void;
  onNavigate: (date: Date) => void;
  onFilterChange: (collezioniIds: string[]) => void;
  selectedCollezioni: string[];
  views?: View[];
}

const viewNames: Record<View, string> = {
  month: 'Mese',
  week: 'Settimana',
  day: 'Giorno',
  agenda: 'Agenda',
  work_week: 'Settimana Lavorativa'
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ 
  view, 
  date, 
  onViewChange, 
  onNavigate,
  onFilterChange,
  selectedCollezioni = [],
  views = ['month', 'week', 'day', 'work_week']
}) => {
  const { collezioni } = useCollezioni();
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = moment(date);
    
    switch (action) {
      case 'PREV':
        switch (view) {
          case 'month':
            newDate.subtract(1, 'month');
            break;
          case 'week':
          case 'work_week':
            newDate.subtract(1, 'week');
            break;
          case 'day':
            newDate.subtract(1, 'day');
            break;
          default:
            newDate.subtract(1, 'day');
        }
        break;
      case 'NEXT':
        switch (view) {
          case 'month':
            newDate.add(1, 'month');
            break;
          case 'week':
          case 'work_week':
            newDate.add(1, 'week');
            break;
          case 'day':
            newDate.add(1, 'day');
            break;
          default:
            newDate.add(1, 'day');
        }
        break;
      case 'TODAY':
        return onNavigate(new Date());
    }
    
    onNavigate(newDate.toDate());
  };

  const handleCollezioneToggle = (collezioneId: string) => {
    const newSelection = selectedCollezioni.includes(collezioneId)
      ? selectedCollezioni.filter(id => id !== collezioneId)
      : [...selectedCollezioni, collezioneId];
    
    onFilterChange(newSelection);
  };

  const formatDateRange = (): string => {
    const start = moment(date);
    let end = moment(date);
    
    switch (view) {
      case 'month':
        return start.format('MMMM YYYY');
      case 'week':
      case 'work_week':
        end = moment(date).endOf('week');
        return `${start.format('D')} - ${end.format('D')} ${start.format('MMMM YYYY')}`;
      case 'day':
        return start.format('dddd, D MMMM YYYY');
      default:
        return start.format('MMMM YYYY');
    }
  };

  const handleSelectAll = () => {
    onFilterChange(collezioni.map(c => c.id.toString()));
  };

  const handleClearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="bg-white border-b">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('TODAY')}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Oggi
          </button>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => navigate('PREV')}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              aria-label="Precedente"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => navigate('NEXT')}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              aria-label="Successivo"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <span className="text-lg font-semibold text-gray-900">
            {formatDateRange()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
            {views.map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`
                  px-3 py-1 text-sm font-medium rounded-md transition-colors
                  ${v === view 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                {viewNames[v]}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100
                ${showFilters ? 'bg-gray-100' : ''}
                ${selectedCollezioni.length > 0 ? 'text-blue-600' : ''}
              `}
              title="Filtra collezioni"
            >
              <Filter size={20} />
              {selectedCollezioni.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-xs flex items-center justify-center bg-blue-500 text-white rounded-full">
                  {selectedCollezioni.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Filtra per collezione</h3>
            <div className="flex gap-2">
              <button 
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                disabled={selectedCollezioni.length === 0}
              >
                Rimuovi filtri
              </button>
              <button 
                onClick={handleSelectAll}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                disabled={selectedCollezioni.length === collezioni.length}
              >
                Seleziona tutte
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {collezioni.map(collezione => (
              <label 
                key={collezione.id} 
                className={`
                  flex items-center gap-2 p-2 rounded-md border cursor-pointer
                  hover:bg-white transition-colors
                  ${selectedCollezioni.includes(collezione.id.toString()) ? 'bg-white shadow-sm' : ''}
                `}
                style={{ borderColor: collezione.colore }}
              >
                <input
                  type="checkbox"
                  checked={selectedCollezioni.includes(collezione.id.toString())}
                  onChange={() => handleCollezioneToggle(collezione.id.toString())}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span 
                  className="flex-1 text-sm font-medium truncate px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${collezione.colore}20` }}
                >
                  {collezione.nome}
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
