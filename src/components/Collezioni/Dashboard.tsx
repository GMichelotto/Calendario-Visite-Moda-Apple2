import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/it';
import { useDatabase } from '../../hooks/useDatabase';
import { 
  Menu,
  Users,
  Layers,
  Calendar as CalendarIcon,
  Upload,
  X,
  AlertTriangle
} from 'lucide-react';

moment.locale('it');
const localizer = momentLocalizer(moment);

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  cliente: string;
  collezione: string;
}

interface Cliente {
  id: string;
  ragione_sociale: string;
  citta: string;
}

interface Collezione {
  id: string;
  nome: string;
  data_inizio: string;
  data_fine: string;
  data_chiusura: string;
}

interface SummaryData {
  clientiTotali: number;
  collezioniAttive: number;
  eventiProssimi: number;
}

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [collezioni, setCollezioni] = useState<Collezione[]>([]);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getEventi, getClienti, getCollezioni, isLoading } = useDatabase();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventiData, clientiData, collezioniData] = await Promise.all([
          getEventi(),
          getClienti(),
          getCollezioni()
        ]);
        
        setEvents(eventiData.map(evento => ({
          ...evento,
          start: new Date(evento.data_inizio),
          end: new Date(evento.data_fine),
          title: `${evento.cliente} - ${evento.collezione}`
        })));
        setClienti(clientiData);
        setCollezioni(collezioniData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      }
    };

    loadData();
  }, [getEventi, getClienti, getCollezioni]);

  const handleFileUpload = (type: 'csv' | 'excel') => {
    console.log(`Uploading ${type} file...`);
  };

  const summaryData: SummaryData = {
    clientiTotali: clienti.length,
    collezioniAttive: collezioni.filter(c => 
      moment(c.data_chiusura).isAfter(moment())
    ).length,
    eventiProssimi: events.filter(e => 
      moment(e.start).isAfter(moment())
    ).length
  };

  const menuItems = [
    { icon: <Users size={20} />, text: 'Clienti', onClick: () => {} },
    { icon: <Layers size={20} />, text: 'Collezioni', onClick: () => {} },
    { icon: <CalendarIcon size={20} />, text: 'Eventi', onClick: () => {} },
    { icon: <Upload size={20} />, text: 'Importa CSV', onClick: () => handleFileUpload('csv') }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-4 py-3">
          <button
            onClick={() => setOpenDrawer(true)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Fashion Calendar</h1>
        </div>
      </header>

      {/* Drawer */}
      {openDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setOpenDrawer(false)}
          />
          <div className="relative bg-white w-64 shadow-xl">
            <div className="flex justify-end p-2">
              <button 
                onClick={() => setOpenDrawer(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="px-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {item.icon}
                  <span>{item.text}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            title="Clienti Totali"
            value={summaryData.clientiTotali}
            icon={<Users className="text-blue-500" size={24} />}
          />
          <SummaryCard
            title="Collezioni Attive"
            value={summaryData.collezioniAttive}
            icon={<Layers className="text-green-500" size={24} />}
          />
          <SummaryCard
            title="Eventi Prossimi"
            value={summaryData.eventiProssimi}
            icon={<CalendarIcon className="text-purple-500" size={24} />}
          />
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow p-6 h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            messages={{
              next: "Successivo",
              previous: "Precedente",
              today: "Oggi",
              month: "Mese",
              week: "Settimana",
              day: "Giorno"
            }}
          />
        </div>
      </main>

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 text-red-700 px-6 py-4 rounded-lg shadow-lg flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {icon}
    </div>
    <p className="text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);

export default Dashboard;
