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
  const [errors, setErrors] = useState({});

  // Inizializza il form con i dati dell'evento o le date iniziali
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
    const timeInMinutes = hour * 60 + minute;
    const workDayStart = 9 * 60;  // 9:00 in minuti
    const workDayEnd = 18 * 60;   // 18:00 in minuti
    
    return timeInMinutes >= workDayStart && timeInMinutes <= workDayEnd;
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

    // Validazione cliente
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Seleziona un cliente';
    }

    // Validazione collezione
    if (!formData.collezione_id) {
      newErrors.collezione_id = 'Seleziona una collezione';
    }

    // Validazione date
    if (!formData.data_inizio) {
      newErrors.data_inizio = 'Inserisci una data di inizio';
    }

    if (!formData.data_fine) {
      newErrors.data_fine = 'Inserisci una data di fine';
    }

    // Validazione data fine successiva a data inizio
    if (end.isSameOrBefore(start)) {
      newErrors.data_fine = 'La data di fine deve essere successiva alla data di inizio';
    }

    // Validazione giorni lavorativi
    if (!isWorkingDay(start)) {
      newErrors.data_inizio = 'La data di inizio deve essere in un giorno lavorativo (Lun-Ven)';
    }

    if (!isWorkingDay(end)) {
      newErrors.data_fine = 'La data di fine deve essere in un giorno lavorativo (Lun-Ven)';
    }

    // Validazione orari lavorativi
    if (!isWorkingHours(start)) {
      newErrors.data_inizio = 'L\'orario di inizio deve essere tra le 9:00 e le 18:00';
    }

    if (!isWorkingHours(end)) {
      newErrors.data_fine = 'L\'orario di fine deve essere tra le 9:00 e le 18:00';
    }

    // Validazione durata massima evento
    const durationInHours = moment.duration(end.diff(start)).asHours();
    if (durationInHours > 4) {
      newErrors.durata = 'La durata massima di un appuntamento è di 4 ore';
    }

    // Validazione evento nello stesso giorno
    if (!start.isSame(end, 'day')) {
      newErrors.date = 'L\'appuntamento deve iniziare e finire nello stesso giorno';
    }

    // Validazione collezione date
    const collezione = collezioni.find(c => c.id === Number(formData.collezione_id));
    if (collezione) {
      const collezioneStart = moment(collezione.data_apertura, 'YYYY-MM-DD');
      const collezioneEnd = moment(collezione.data_chiusura, 'YYYY-MM-DD');
      
      if (start.isBefore(collezioneStart) || end.isAfter(collezioneEnd)) {
        newErrors.collezione = 'Le date devono essere comprese nel periodo della collezione';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, collezioni]);

  // Gestione cambiamenti form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        <div className="modal-header">
          <h2>{event ? 'Modifica Evento' : 'Nuovo Evento'}</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Cliente Select */}
          <div className="form-group">
            <label htmlFor="cliente_id">Cliente:</label>
            <select
              id="cliente_id"
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              disabled={clientiLoading}
              className={errors.cliente_id ? 'error' : ''}
            >
              <option value="">Seleziona un cliente</option>
              {clienti.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.ragione_sociale}
                </option>
              ))}
            </select>
            {errors.cliente_id && (
              <span className="error-message">{errors.cliente_id}</span>
            )}
          </div>

          {/* Collezione Select */}
          <div className="form-group">
            <label htmlFor="collezione_id">Collezione:</label>
            <select
              id="collezione_id"
              name="collezione_id"
              value={formData.collezione_id}
              onChange={handleChange}
              disabled={collezioniLoading || !formData.cliente_id}
              className={errors.collezione_id ? 'error' : ''}
            >
              <option value="">Seleziona una collezione</option>
              {getCollezioniForCliente(formData.cliente_id).map(collezione => (
                <option key={collezione.id} value={collezione.id}>
                  {collezione.nome}
                </option>
              ))}
            </select>
            {errors.collezione_id && (
              <span className="error-message">{errors.collezione_id}</span>
            )}
          </div>

          {/* Data e Ora Inizio */}
          <div className="form-group">
            <label htmlFor="data_inizio">Data e Ora Inizio:</label>
            <input
              type="datetime-local"
              id="data_inizio"
              name="data_inizio"
              value={formData.data_inizio}
              onChange={handleChange}
              className={errors.data_inizio ? 'error' : ''}
            />
            {errors.data_inizio && (
              <span className="error-message">{errors.data_inizio}</span>
            )}
          </div>

          {/* Data e Ora Fine */}
          <div className="form-group">
            <label htmlFor="data_fine">Data e Ora Fine:</label>
            <input
              type="datetime-local"
              id="data_fine"
              name="data_fine"
              value={formData.data_fine}
              onChange={handleChange}
              className={errors.data_fine ? 'error' : ''}
            />
            {errors.data_fine && (
              <span className="error-message">{errors.data_fine}</span>
            )}
          </div>

          {/* Note */}
          <div className="form-group">
            <label htmlFor="note">Note:</label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {/* Messaggi di errore generali */}
          {Object.keys(errors).length > 0 && (
            <div className="error-messages">
              {Object.entries(errors)
                .filter(([key]) => !['cliente_id', 'collezione_id', 'data_inizio', 'data_fine'].includes(key))
                .map(([key, message]) => (
                  <p key={key} className="error-message">
                    {message}
                  </p>
                ))}
            </div>
          )}

          {/* Bottoni */}
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="button secondary"
              disabled={isLoading}
            >
              Annulla
            </button>
            <button 
              type="submit"
              className="button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Salvataggio...' : (event ? 'Aggiorna' : 'Crea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
