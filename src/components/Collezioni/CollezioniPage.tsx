import React, { useState, useCallback, useEffect } from 'react';
import { useCollezioni, useClienti, useEventi } from '../../hooks/useDatabase';
import CollezioniList from './CollezioniList';
import CollezioneForm from './CollezioneForm';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import { Grid, List, Download, Plus, AlertCircle } from 'lucide-react';
import './CollezioniPage.css';

interface Collezione {
  id: number;
  nome: string;
  colore: string;
  data_apertura: string;
  data_chiusura: string;
  clienti_count?: number;
  eventi_count?: number;
}

interface Message {
  text: string;
  type: 'success' | 'error';
}

const CollezioniPage = () => {
  const { 
    collezioni, 
    isLoading, 
    error, 
    createCollezione, 
    updateCollezione, 
    deleteCollezione,
    refreshCollezioni
  } = useCollezioni();

  const {
    clienti,
    isLoading: isLoadingClienti
  } = useClienti();

  const {
    eventi,
    isLoading: isLoadingEventi
  } = useEventi();

  const [showForm, setShowForm] = useState(false);
  const [selectedCollezione, setSelectedCollezione] = useState<Collezione | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [collezioniWithCounts, setCollezioniWithCounts] = useState<Collezione[]>([]);

  useEffect(() => {
    if (collezioni && clienti && eventi) {
      const updatedCollezioni = collezioni.map(collezione => {
        const clientiCount = clienti.filter(cliente => 
          cliente.collezioni_ids?.split(',').includes(collezione.id.toString())
        ).length;

        const eventiCount = eventi.filter(evento => 
          evento.collezione_id === collezione.id
        ).length;

        return {
          ...collezione,
          clienti_count: clientiCount,
          eventi_count: eventiCount
        };
      });

      setCollezioniWithCounts(updatedCollezioni);
    }
  }, [collezioni, clienti, eventi]);

  const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleDownloadCalendario = useCallback(() => {
    try {
      const doc = new jsPDF();
      const today = moment();

      collezioniWithCounts.forEach((collezione, index) => {
        if (index > 0) doc.addPage();

        doc.setFontSize(18);
        doc.text(collezione.nome, 14, 20);
        doc.setFontSize(12);
        doc.text(`Periodo: ${moment(collezione.data_apertura).format('DD/MM/YYYY')} - ${moment(collezione.data_chiusura).format('DD/MM/YYYY')}`, 14, 30);

        const collezioneEventi = eventi
          .filter(e => e.collezione_id === collezione.id)
          .map(evento => {
            const cliente = clienti.find(c => c.id === evento.cliente_id);
            return {
              cliente: cliente?.ragione_sociale || 'N/D',
              data: moment(evento.data_inizio).format('DD/MM/YYYY'),
              orario: `${moment(evento.data_inizio).format('HH:mm')} - ${moment(evento.data_fine).format('HH:mm')}`,
              stato: moment(evento.data_inizio).isBefore(today) ? 'Completato' : 'Programmato'
            };
          })
          .sort((a, b) => moment(a.data).diff(moment(b.data)));

        doc.autoTable({
          startY: 40,
          head: [['Cliente', 'Data', 'Orario', 'Stato']],
          body: collezioneEventi.map(e => [
            e.cliente,
            e.data,
            e.orario,
            e.stato
          ]),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 40;
        doc.text(`Totale clienti: ${collezione.clienti_count}`, 14, finalY + 10);
        doc.text(`Totale appuntamenti: ${collezione.eventi_count}`, 14, finalY + 20);
      });

      doc.save('calendario-collezioni.pdf');
      showMessage('Calendario esportato con successo');
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error);
      showMessage('Errore durante la generazione del PDF', 'error');
    }
  }, [collezioniWithCounts, eventi, clienti, showMessage]);

  const handleCreateCollezione = useCallback(async (collezione: Omit<Collezione, 'id'>) => {
    try {
      await createCollezione(collezione);
      setShowForm(false);
      refreshCollezioni();
      showMessage('Collezione creata con successo');
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }, [createCollezione, refreshCollezioni, showMessage]);

  const handleEditCollezione = useCallback((collezione: Collezione) => {
    setSelectedCollezione(collezione);
    setShowForm(true);
  }, []);

  const handleUpdateCollezione = useCallback(async (collezione: Collezione) => {
    try {
      await updateCollezione(collezione);
      setShowForm(false);
      setSelectedCollezione(null);
      refreshCollezioni();
      showMessage('Collezione aggiornata con successo');
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
  }, [updateCollezione, refreshCollezioni, showMessage]);

  const handleDeleteCollezione = useCallback(async (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa collezione?')) {
      try {
        await deleteCollezione(id);
        refreshCollezioni();
        showMessage('Collezione eliminata con successo');
      } catch (error) {
        showMessage((error as Error).message, 'error');
      }
    }
  }, [deleteCollezione, refreshCollezioni, showMessage]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">Gestione Collezioni</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                {view === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
              <button 
                onClick={handleDownloadCalendario}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Nuova Collezione
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-6 py-8">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'error' && <AlertCircle size={20} />}
              {message.text}
            </div>
          </div>
        )}

        {isLoading || isLoadingClienti || isLoadingEventi ? (
          <div className="text-center py-8">Caricamento...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">{error}</div>
        ) : (
          view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collezioniWithCounts.map(collezione => (
                <CollezioneForm 
                  key={collezione.id}
                  collezione={collezione}
                  onSubmit={handleUpdateCollezione}
                  onDelete={() => handleDeleteCollezione(collezione.id)}
                />
              ))}
            </div>
          ) : (
            <CollezioniList
              collezioni={collezioniWithCounts}
              onEdit={handleEditCollezione}
              onDelete={handleDeleteCollezione}
            />
          )
        )}

        {showForm && (
          <CollezioneForm
            collezione={selectedCollezione}
            onSubmit={selectedCollezione ? handleUpdateCollezione : handleCreateCollezione}
            onClose={() => {
              setShowForm(false);
              setSelectedCollezione(null);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default CollezioniPage;
