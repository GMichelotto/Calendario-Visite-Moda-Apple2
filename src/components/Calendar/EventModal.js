// src/components/Calendar/EventModal.js
import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { useClienti, useCollezioni } from '../../hooks/useDatabase';
import './EventModal.css';

const EventModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  event = null, 
  initialStart = null,
  initialEnd = null,
  isLoading = false
}) => {
  const { clienti, isLoading: clientiLoading } = useClienti();
  const { collezioni, isLoading: collezioniLoading } = useCollezioni();
  const [formData, setFormData] = useState({
    cliente_id: '',
    collezione_id: '',
    data_inizio: '',
    data_fine: '',
    note: ''
  });
  const [visitDuration, setVisitDuration] = useState(120); // Default 2 ore
  const [errors, setErrors] = useState({});

  // Carica la durata della visita quando cambiano cliente e collezione
  useEffect(() => {
    const loadVisitDuration = async () => {
      if (formData.cliente_id && formData.collezione_id) {
        try {
          const response = await window.electronAPI.database.operation(
            'getClienteCollezioneDuration',
            { 
              cliente_id: formData.cliente_id, 
              collezione_id: formData.collezione_id 
            }
          );
          if (response.success) {
            setVisitDuration(response.data);
            // Aggiorna la data di fine in base alla nuova durata
            if (formData.data_inizio) {
              const newEnd = moment(formData.data_inizio)
                .add(response.data, 'minutes')
                .format('YYYY-MM-DDTHH:mm');
              setFormData(prev => ({ ...prev, data_fine: newEnd }));
            }
          }
        } catch (error) {
          console.error('Errore nel caricamento della durata visita:', error);
        }
      }
    };

    loadVisitDuration();
  }, [formData.cliente_id, formData.collezione_id]);

  // Inizializza il form
  useEffect(() => {
    if (event) {
      setFormData({
        cliente_id: event.cliente_id,
        collezione_id: event.collezione_id,
        data_inizio: moment(event.start).format('YYYY-MM-DDTHH:mm'),
        data_fine: moment(event.end).format('YYYY-MM-DDTHH:mm'),
        note: event.note || ''
      });
    } else if (initialStart && initialEnd) {
      setFormData(prev => ({
        ...prev,
        data_inizio: moment(initialStart).format('YYYY-MM-DDTHH:mm'),
        data_fine: moment(initialEnd).format('YYYY-MM-DDTHH:mm')
      }));
    }
  }, [event, initialStart, initialEnd]);

  // Funzioni di utilità per la validazione
  const isWorkingHours = (date) => {
    const hour = date.hours();
    const minute = date.minutes();
    return (hour >= 9 && hour < 18) || (hour === 18 && minute === 0);
  };

  const isWorkingDay = (date) => {
    const day = date.day();
    return day >= 1 && day <= 5;  // 1 = Lunedì, 5 = Venerdì
  };

  // Validazione del form
  const validateForm = useCallback(() => {
    const newErrors = {};
    const start = moment(formData.data_inizio);
    const end = moment(formData.data_fine);

    // Validazioni base
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Seleziona un cliente';
    }

    if (!formData.collezione_id) {
      newErrors.collezione_id = 'Seleziona una collezione';
    }

    if (!formData.data_inizio || !formData.data_fine) {
      newErrors.date = 'Le date di inizio e fine sono obbligatorie';
    }

    // Validazioni avanzate
    if (start && end) {
      // Verifica giorni lavorativi
      if (!isWorkingDay(start) || !isWorkingDay(end)) {
        newErrors.date = 'Gli appuntamenti sono possibili solo nei giorni lavorativi (Lun-Ven)';
      }

      // Verifica orari lavorativi
      if (!isWorkingHours(start) || !isWorkingHours(end)) {
        newErrors.date = 'Gli appuntamenti sono possibili solo dalle 9:00 alle 18:00';
      }

      // Verifica durata
      const duration = moment.duration(end.diff(start)).asMinutes();
      if (duration !== visitDuration) {
        newErrors.duration = `La durata dell'appuntamento deve essere di ${visitDuration} minuti`;
      }

      // Verifica periodo collezione
      if (formData.collezione_id) {
        const collezione = collezioni.find(c => c.id === Number(formData.collezione_id));
        if (collezione) {
          const collectionStart = moment(collezione.data_apertura);
          const collectionEnd = moment(collezione.data_chiusura);
          if (start.isBefore(collectionStart) || end.isAfter(collectionEnd)) {
            newErrors.collezione = 'Le date devono essere nel periodo della collezione';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, collezioni, visitDuration]);

  // Gestione cambiamenti form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Se cambia la data di inizio, aggiorna automaticamente la data di fine
      if (name === 'data_inizio' && value) {
        newData.data_fine = moment(value)
          .add(visitDuration, 'minutes')
          .format('YYYY-MM-DDTHH:mm');
      }

      return newData;
    });
  };

  // Gestione submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await onSave({
        ...formData,
        id: event?.id,
        start: new Date(formData.data_inizio),
        end: new Date(formData.data_fine)
      });
    }
  };

  // Filtra collezioni per cliente
  const getCollezioniForCliente = useCallback((clienteId) => {
    const cliente = clienti.find(c => c.id === Number(clienteId));
    if (!cliente || !cliente.collezioni_ids) return [];
    return collezioni.filter(col => 
      cliente.collezioni_ids.split(',').map(Number).includes(col.id)
    );
  }, [clienti, collezioni]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {/* ... resto del JSX come prima ... */}
        {/* Aggiunta indicatore durata visita */}
        {formData.cliente_id && formData.collezione_id && (
          <div className="visit-duration-info">
            Durata visita impostata: {visitDuration} minuti
          </div>
        )}
        {/* ... resto del JSX come prima ... */}
      </div>
    </div>
  );
};

export default EventModal;
