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

interface ValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duration?: number;
  checks: {
    timeConstraints: boolean;
    overlap: boolean;
    clientAvailability: boolean;
    collectionPeriod: boolean;
    duration: boolean;
  };
}

interface EventValidationRequest {
  cliente_id: string;
  collezione_id: string;
  data_inizio: string;
  data_fine: string;
  id?: number;
}

interface CustomEvent {
  id: number;
  cliente_id: string;
  collezione_id: string;
  start: Date;
  end: Date;
  note?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: EventFormData) => Promise<void>;
  event?: CustomEvent | null;
  initialStart?: Date | null;
  initialEnd?: Date | null;
  isLoading?: boolean;
  validationResults?: ValidationResults | null;
}

interface EventFormData {
  cliente_id: string;
  collezione_id: string;
  data_inizio: string;
  data_fine: string;
  note: string;
}

interface ValidationResults {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    timeConstraints: boolean | null;
    overlap: boolean | null;
    clientAvailability: boolean | null;
    collectionPeriod: boolean | null;
    duration: boolean | null;
  };
  context?: {
    clientWorkload?: {
      num_appuntamenti: number;
      durata_totale: number;
    };
    collectionAvailability?: {
      slot_start: string;
      status: string;
    }[];
  };
}

const EventModal: React.FC<EventModalProps> = ({ 
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
  const [formData, setFormData] = useState<EventFormData>({
    cliente_id: '',
    collezione_id: '',
    data_inizio: '',
    data_fine: '',
    note: ''
  });
  const [validations, setValidations] = useState<ValidationResults>({
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

  useEffect(() => {
    const loadVisitDuration = async () => {
      if (formData.cliente_id && formData.collezione_id) {
        try {
          const validation = await window.electronAPI.eventi.validate({
            cliente_id: formData.cliente_id,
            collezione_id: formData.collezione_id,
            data_inizio: formData.data_inizio,
            data_fine: formData.data_fine
          } as EventValidationRequest) as ValidationResponse;
          
          if (validation.isValid && formData.data_inizio) {
            const visitDuration = validation.duration || 120;
            const newEnd = moment(formData.data_inizio)
              .add(visitDuration, 'minutes')
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

  const validateForm = useCallback(async () => {
    if (!formData.cliente_id || !formData.collezione_id || !formData.data_inizio || !formData.data_fine) {
      return;
    }

    setIsValidating(true);
    try {
      const validation = await window.electronAPI.eventi.validate({
        ...formData,
        id: event?.id
      } as EventValidationRequest) as ValidationResponse;

      const [clientData, collectionData] = await Promise.all([
        window.electronAPI.clienti.getById(parseInt(formData.cliente_id)),
        window.electronAPI.collezioni.checkAvailability(
          parseInt(formData.collezione_id),
          new Date(formData.data_inizio),
          new Date(formData.data_fine)
        )
      ]);

      setValidations({
        ...validation,
        context: {
          clientWorkload: {
            num_appuntamenti: clientData.appointments_count || 0,
            durata_totale: clientData.total_duration || 0
          },
          collectionAvailability: collectionData
        }
      });
    } catch (error) {
      console.error('Validation error:', error);
      setValidations(prev => ({
        ...prev,
        isValid: false,
        errors: [...prev.errors, 'Errore durante la validazione. Riprova più tardi.']
      }));
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      if (name === 'data_inizio' && value) {
        const currentDuration = moment(prev.data_fine).diff(moment(prev.data_inizio), 'minutes');
        newData.data_fine = moment(value)
          .add(currentDuration, 'minutes')
          .format('YYYY-MM-DDTHH:mm');
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validations.isValid) {
      await onSave(formData);
    }
  };

  const getSlotClassName = useCallback((slot: moment.Moment) => {
    if (!validations.context?.collectionAvailability) return '';
    const slotInfo = validations.context.collectionAvailability.find(
      s => s.slot_start === slot.format('HH:mm')
    );
    return slotInfo?.status || '';
  }, [validations.context?.collectionAvailability]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>
            {event ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <User size={16} />
              Cliente
              <select
                name="cliente_id"
                value={formData.cliente_id}
                onChange={handleChange}
                required
                disabled={isLoading || clientiLoading}
              >
                <option value="">Seleziona cliente</option>
                {clienti.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.ragione_sociale}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-group">
            <label>
              <CalendarIcon size={16} />
              Collezione
              <select
                name="collezione_id"
                value={formData.collezione_id}
                onChange={handleChange}
                required
                disabled={isLoading || collezioniLoading}
              >
                <option value="">Seleziona collezione</option>
                {collezioni.map(collezione => (
                  <option key={collezione.id} value={collezione.id}>
                    {collezione.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-group">
            <label>
              <Clock size={16} />
              Data e ora inizio
              <input
                type="datetime-local"
                name="data_inizio"
                value={formData.data_inizio}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              <Clock size={16} />
              Data e ora fine
              <input
                type="datetime-local"
                name="data_fine"
                value={formData.data_fine}
                onChange={handleChange}
                required
                disabled={isLoading}
                readOnly
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              <Info size={16} />
              Note
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                disabled={isLoading}
              />
            </label>
          </div>

          {validations.errors.length > 0 && (
            <div className="validation-errors">
              {validations.errors.map((error, index) => (
                <div key={index} className="validation-message error">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              ))}
            </div>
          )}

          {validations.warnings.length > 0 && (
            <div className="validation-warnings">
              {validations.warnings.map((warning, index) => (
                <div key={index} className="validation-message warning">
                  <AlertCircle size={16} />
                  {warning}
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} disabled={isLoading}>
              Annulla
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !validations.isValid || isValidating}
              className={validations.isValid ? 'valid' : 'invalid'}
            >
              {isLoading || isValidating ? (
                'Caricamento...'
              ) : (
                <>
                  {validations.isValid ? <Check size={16} /> : <AlertTriangle size={16} />}
                  {event ? 'Aggiorna' : 'Crea'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
