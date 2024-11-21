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

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: EventFormData) => Promise<void>;
  event?: Event | null;
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
          const response = await window.electron.ipcRenderer.invoke(
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

  const validateForm = useCallback(async () => {
    if (!formData.cliente_id || !formData.collezione_id || !formData.data_inizio || !formData.data_fine) {
      return;
    }

    setIsValidating(true);
    try {
      const validation = await window.electron.ipcRenderer.invoke(
        'eventi:validate',
        { 
          eventData: formData,
          excludeEventId: event?.id 
        }
      );

      const [clientWorkload, collectionAvailability] = await Promise.all([
        window.electron.ipcRenderer.invoke(
          'clienti:getWorkload',
          {
            cliente_id: formData.cliente_id,
            start_date: moment(formData.data_inizio).format('YYYY-MM-DD'),
            end_date: moment(formData.data_inizio).format('YYYY-MM-DD')
          }
        ),
        window.electron.ipcRenderer.invoke(
          'collezioni:getAvailability',
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

  if (!isOpen) return null;

  const getSlotClassName = useCallback((slot: moment.Moment) => {
    if (!validations.context?.collectionAvailability) return '';
    const slotInfo = validations.context.collectionAvailability.find(
      s => s.slot_start === slot.format('HH:mm')
    );
    return slotInfo?.status || '';
  }, [validations.context?.collectionAvailability]);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {/* Il resto del JSX rimane identico */}
      </div>
    </div>
  );
};

export default EventModal;
