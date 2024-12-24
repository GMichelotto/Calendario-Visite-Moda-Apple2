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
  EventFormData
} from '../../types/database';

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

  // ... resto del componente rimane uguale ...

  return (
    // ... JSX rimane uguale ...
  );
};

export default EventModal;
