// src/components/Collezioni/CollezioniPage.js
import React, { useState, useCallback, useEffect } from 'react';
import { useCollezioni, useClienti, useEventi } from '../../hooks/useDatabase';
import CollezioniList from './CollezioniList';
import CollezioneForm from './CollezioneForm';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';
import './CollezioniPage.css';

const CollezioniPage = () => {
  const { 
    collezioni, 
    isLoading: isLoadingCollezioni, 
    error: collezioniError, 
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
  const [selectedCollezione, setSelectedCollezione] = useState(null);
  const [message, setMessage] = useState(null);
  const [view, setView] = useState('grid');
  const [collezioniWithCounts, setCollezioniWithCounts] = useState([]);

  // Calcola i conteggi per le collezioni
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

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Generazione PDF del calendario
  const handleDownloadCalendario = useCallback(() => {
    try {
      const doc = new jsPDF();
      const today = moment();

      collezioniWithCounts.forEach((collezione, index) => {
        if (index > 0) doc.addPage();

        // Intestazione
        doc.setFontSize(18);
        doc.text(collezione.nome, 14, 20);
        doc.setFontSize(12);
        doc.text(`Periodo: ${moment(collezione.data_apertura).format('DD/MM/YYYY')} - ${moment(collezione.data_chiusura).format('DD/MM/YYYY')}`, 14, 30);

        // Filtra eventi per questa collezione
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

        // Tabella eventi
        doc.autoTable({
          startY: 40,
          head: [['Cliente', 'Data', 'Orario', 'Stato']],
          body: collezioneEventi.map(e => [
            e.cliente,
            e.data,
            e.orario,
            e.stato
          ]),
          styles: {
            fontSize: 10
          },
          headStyles: {
            fillColor: [66, 139, 202]
          }
        });

        // Statistiche
        const finalY = doc.lastAutoTable.finalY || 40;
        doc.text(`Totale clienti: ${collezione.clienti_count}`, 14, finalY + 10);
        doc.text(`Totale appuntamenti: ${collezione.eventi_count}`, 14, finalY + 20);
      });

      doc.save('calendario-collezioni.pdf');
      showMessage('Calendario esportato con successo');
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error);
      showMessage('Errore durante la generazione del PDF', 'error');
    }
  }, [collezioniWithCounts, eventi, clienti]);

  // ... resto del codice esistente ...

  return (
    <div className="collezioni-page">
      {/* ... header e altri elementi esistenti ... */}
      
      {/* Aggiorna la render logic per usare collezioniWithCounts invece di collezioni */}
      {!error && !isLoading && (
        view === 'grid' ? (
          <div className="collezioni-grid">
            {collezioniWithCounts.map(collezione => (
              // ... grid view con i conteggi aggiornati ...
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

      {/* ... resto del codice esistente ... */}
    </div>
  );
};

export default CollezioniPage;
