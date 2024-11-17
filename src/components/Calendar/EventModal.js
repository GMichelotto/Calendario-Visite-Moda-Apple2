// src/components/Calendar/EventModal.js
import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Calendar as CalendarIcon,
  User,
  Info,
  AlertCircle
} from 'lucide-react';
import { useClienti, useCollezioni } from '../../hooks/useDatabase';

const EventModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  event = null, 
  initialStart = null,
  initialEnd = null,
  isLoading = false,
  validationResults = null
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
  const [validations, setValidations] = useState({
    isValid: true,
    errors: [],
    warnings: [],
    checks: {
      timeConstraints: null,
      overlap: null,
      clientAvailability: null,
      collectionPeriod: null,
      duration: null
    }
  });
  const [isValidating, setIsValidating] = useState(false);

  // Inizializzazione form
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

  // Carica durata visita quando cambiano cliente e collezione
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
          
          if (response.success && formData.data_inizio) {
            const newEnd = moment(formData.data_inizio)
              .add(response.data, 'minutes')
              .format('YYYY-MM-DDTHH:mm');
            setFormData(prev => ({ ...prev, data_fine: newEnd }));
          }
        } catch (error) {
          console.error('Error loading visit duration:', error);
        }
      }
    };

    loadVisitDuration();
  }, [formData.cliente_id, formData.collezione_id, formData.data_inizio]);

  // Validazione in tempo reale
  const validateForm = useCallback(async () => {
    if (!formData.cliente_id || !formData.collezione_id || !formData.data_inizio || !formData.data_fine) {
      return;
    }

    setIsValidating(true);
    try {
      const validation = await window.electronAPI.database.operation(
        'validateEventConstraints',
        { 
          eventData: formData,
          excludeEventId: event?.id 
        }
      );

      // Carica informazioni aggiuntive sul contesto
      const [clientWorkload, collectionAvailability] = await Promise.all([
        window.electronAPI.database.operation(
          'getClienteWorkload',
          {
            cliente_id: formData.cliente_id,
            start_date: moment(formData.data_inizio).format('YYYY-MM-DD'),
            end_date: moment(formData.data_inizio).format('YYYY-MM-DD')
          }
        ),
        window.electronAPI.database.operation(
          'getCollectionAvailability',
          {
            collezione_id: formData.collezione_id,
            date: moment(formData.data_inizio).format('YYYY-MM-DD')
          }
        )
      ]);

      setValidations({
        ...validation,
        context: {
          clientWorkload,
          collectionAvailability
        }
      });
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [formData, event?.id]);

  useEffect(() => {
    const debounceValidation = setTimeout(() => {
      validateForm();
    }, 500);

    return () => clearTimeout(debounceValidation);
  }, [validateForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Se cambia la data di inizio, aggiorna la fine mantenendo la durata
      if (name === 'data_inizio' && value) {
        const currentDuration = moment(prev.data_fine).diff(moment(prev.data_inizio), 'minutes');
        newData.data_fine = moment(value)
          .add(currentDuration, 'minutes')
          .format('YYYY-MM-DDTHH:mm');
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validations.isValid) {
      await onSave(formData);
    }
  };

  if (!isOpen) return null;

  const getSlotClassName = useCallback((slot) => {
    if (!validations.context?.collectionAvailability) return '';
    const slotInfo = validations.context.collectionAvailability.find(
      s => s.slot_start === slot.format('HH:mm')
    );
    return slotInfo?.status || '';
  }, [validations.context?.collectionAvailability]);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{event ? 'Modifica Evento' : 'Nuovo Evento'}</h2>
          <button 
            type="button"
            className="close-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Dettagli Appuntamento</h3>
              
              {/* Cliente Select */}
              <div className="form-group">
                <label htmlFor="cliente_id">
                  <User size={16} />
                  Cliente:
                </label>
                <select
                  id="cliente_id"
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  disabled={isLoading || clientiLoading}
                >
                  <option value="">Seleziona un cliente</option>
                  {clienti.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.ragione_sociale}
                    </option>
                  ))}
                </select>
              </div>

              {/* Collezione Select */}
              <div className="form-group">
                <label htmlFor="collezione_id">
                  <CalendarIcon size={16} />
                  Collezione:
                </label>
                <select
                  id="collezione_id"
                  name="collezione_id"
                  value={formData.collezione_id}
                  onChange={handleChange}
                  disabled={isLoading || collezioniLoading || !formData.cliente_id}
                >
                  <option value="">Seleziona una collezione</option>
                  {formData.cliente_id && collezioni
                    .filter(col => {
                      const cliente = clienti.find(c => c.id === Number(formData.cliente_id));
                      return cliente?.collezioni_ids?.split(',').includes(col.id.toString());
                    })
                    .map(collezione => (
                      <option key={collezione.id} value={collezione.id}>
                        {collezione.nome}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Date e Ora */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="data_inizio">
                    <Clock size={16} />
                    Inizio:
                  </label>
                  <input
                    type="datetime-local"
                    id="data_inizio"
                    name="data_inizio"
                    value={formData.data_inizio}
                    onChange={handleChange}
                    min={moment().format('YYYY-MM-DDTHH:mm')}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="data_fine">
                    <Clock size={16} />
                    Fine:
                  </label>
                  <input
                    type="datetime-local"
                    id="data_fine"
                    name="data_fine"
                    value={formData.data_fine}
                    onChange={handleChange}
                    min={formData.data_inizio}
                    readOnly
                  />
                </div>
              </div>

              {/* Note */}
              <div className="form-group">
                <label htmlFor="note">
                  <Info size={16} />
                  Note:
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Aggiungi note all'appuntamento..."
                />
              </div>
            </div>

            {/* Validazioni */}
            {isValidating ? (
              <div className="validation-loading">
                Verifica disponibilità...
              </div>
            ) : (
              <div className="validation-section">
                {validations.errors.length > 0 && (
                  <div className="validation-errors">
                    <h4>
                      <AlertCircle size={16} />
                      Errori
                    </h4>
                    <ul>
                      {validations.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validations.warnings.length > 0 && (
                  <div className="validation-warnings">
                    <h4>
                      <AlertTriangle size={16} />
                      Avvisi
                    </h4>
                    <ul>
                      {validations.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validations.context && (
                  <div className="context-info">
                    <h4>Informazioni Aggiuntive</h4>
                    
                    {/* Cliente Workload */}
                    {validations.context.clientWorkload && (
                      <div className="workload-info">
                        <p>
                          Appuntamenti cliente in questa giornata: 
                          {validations.context.clientWorkload.num_appuntamenti}
                        </p>
                        <p>
                          Durata totale: 
                          {validations.context.clientWorkload.durata_totale} min
                        </p>
                      </div>
                    )}

                    {/* Slots Disponibili */}
                    <div className="availability-timeline">
                      {[...Array(18)].map((_, i) => {
                        const slot = moment().hour(9).minute(0).add(i * 30, 'minutes');
                        return (
                          <div 
                            key={i}
                            className={`time-slot ${getSlotClassName(slot)}`}
                            title={`${slot.format('HH:mm')}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={onClose}
                className="button secondary"
                disabled={isLoading || isValidating}
              >
                Annulla
              </button>
              <button 
                type="submit"
                className="button primary"
                disabled={isLoading || isValidating || !validations.isValid}
              >
                {isLoading ? 'Salvataggio...' : (event ? 'Aggiorna' : 'Crea')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
