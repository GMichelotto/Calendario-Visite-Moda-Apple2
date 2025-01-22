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
import type { 
  ValidationResponse,
  EventValidationRequest,
  CustomEvent,
  EventFormData,
  APIResponse,
  Cliente
} from '../../../electron/types';

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
          const validationRequest: EventValidationRequest = {
            cliente_id: formData.cliente_id,
            collezione_id: formData.collezione_id,
            data_inizio: formData.data_inizio,
            data_fine: formData.data_fine
          };

          const validation = await window.electronAPI.eventi.validate(validationRequest);
          
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
      });

      const clientResponse: APIResponse<Cliente> = await window.electronAPI.clienti.getById(parseInt(formData.cliente_id));

      const collectionData = await window.electronAPI.collezioni.checkAvailability(
        parseInt(formData.collezione_id),
        new Date(formData.data_inizio),
        new Date(formData.data_fine)
      );

      setValidations({
        ...validation,
        context: {
          clientWorkload: {
            num_appuntamenti: clientResponse.data.appointments_count || 0,
            durata_totale: clientResponse.data.total_duration || 0
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {event ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-4">
            <label className="block">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <User size={16} />
                Cliente
              </div>
              <select
                name="cliente_id"
                value={formData.cliente_id}
                onChange={handleChange}
                required
                disabled={isLoading || clientiLoading}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleziona cliente</option>
                {clienti.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.ragione_sociale}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <CalendarIcon size={16} />
                Collezione
              </div>
              <select
                name="collezione_id"
                value={formData.collezione_id}
                onChange={handleChange}
                required
                disabled={isLoading || collezioniLoading}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleziona collezione</option>
                {collezioni.map(collezione => (
                  <option key={collezione.id} value={collezione.id}>
                    {collezione.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} />
                Data e ora inizio
              </div>
              <input
                type="datetime-local"
                name="data_inizio"
                value={formData.data_inizio}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </label>

            <label className="block">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} />
                Data e ora fine
              </div>
              <input
                type="datetime-local"
                name="data_fine"
                value={formData.data_fine}
                onChange={handleChange}
                required
                disabled={isLoading}
                readOnly
                className="w-full rounded-md border border-gray-300 p-2 bg-gray-50 cursor-not-allowed"
              />
            </label>

            <label className="block">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Info size={16} />
                Note
              </div>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-24 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </label>
          </div>

          {validations.errors.length > 0 && (
            <div className="space-y-2">
              {validations.errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded">
                  <AlertTriangle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              ))}
            </div>
          )}

          {validations.warnings.length > 0 && (
            <div className="space-y-2">
              {validations.warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded">
                  <AlertCircle size={16} />
                  <span className="text-sm">{warning}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Annulla
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !validations.isValid || isValidating}
              className={`px-4 py-2 rounded flex items-center gap-2 focus:outline-none focus:ring-2 transition-colors ${
                validations.isValid 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              } disabled:opacity-50`}
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
