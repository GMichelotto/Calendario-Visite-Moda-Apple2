import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { ChromePicker, ColorResult } from 'react-color';
import './CollezioneForm.css';
import { Collezione } from '../../types/database';

interface CollezioneFormProps {
  collezione: Collezione | null;
  onSubmit: (collezione: Collezione) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: number) => Promise<void>;
  isLoading?: boolean;
}

interface FormData extends Omit<Collezione, 'id' | 'clienti_count' | 'eventi_count'> {
  note: string;
}

interface FormErrors {
  nome?: string;
  data_apertura?: string;
  data_chiusura?: string;
}

const CollezioneForm: React.FC<CollezioneFormProps> = ({ 
  collezione = null, 
  onSubmit, 
  onCancel, 
  onDelete,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    colore: '#4A90E2',
    data_apertura: '',
    data_chiusura: '',
    note: ''
  });
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (collezione) {
      setFormData({
        nome: collezione.nome,
        colore: collezione.colore,
        data_apertura: moment(collezione.data_apertura).format('YYYY-MM-DD'),
        data_chiusura: moment(collezione.data_chiusura).format('YYYY-MM-DD'),
        note: collezione.note || ''
      });
    } else {
      const today = moment();
      setFormData(prev => ({
        ...prev,
        data_apertura: today.format('YYYY-MM-DD'),
        data_chiusura: today.add(14, 'days').format('YYYY-MM-DD')
      }));
    }
  }, [collezione]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const today = moment().startOf('day');
    const apertura = moment(formData.data_apertura);
    const chiusura = moment(formData.data_chiusura);

    if (!formData.nome.trim()) {
      newErrors.nome = 'Il nome della collezione è obbligatorio';
    }

    if (!formData.data_apertura) {
      newErrors.data_apertura = 'La data di apertura è obbligatoria';
    }

    if (!formData.data_chiusura) {
      newErrors.data_chiusura = 'La data di chiusura è obbligatoria';
    }

    if (chiusura.isSameOrBefore(apertura)) {
      newErrors.data_chiusura = 'La data di chiusura deve essere successiva alla data di apertura';
    }

    if (!collezione && apertura.isBefore(today)) {
      newErrors.data_apertura = 'La data di apertura non può essere nel passato';
    }

    if (chiusura.diff(apertura, 'days') < 7) {
      newErrors.data_chiusura = 'La collezione deve durare almeno 7 giorni';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submittedData: Collezione = {
        ...formData,
        nome: formData.nome.trim(),
        id: collezione?.id || 0
      };
      await onSubmit(submittedData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorChange = (color: ColorResult) => {
    setFormData(prev => ({
      ...prev,
      colore: color.hex
    }));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal collezione-form-modal">
        <div className="modal-header">
          <h2>{collezione ? 'Modifica Collezione' : 'Nuova Collezione'}</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="collezione-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="nome">Nome Collezione *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={errors.nome ? 'error' : ''}
                disabled={isLoading}
                placeholder="es. Primavera/Estate 2025"
              />
              {errors.nome && (
                <span className="error-message">{errors.nome}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Colore</label>
              <div className="color-picker-container">
                <div 
                  className="color-preview"
                  style={{ backgroundColor: formData.colore }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                <input
                  type="text"
                  value={formData.colore}
                  readOnly
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="color-input"
                />
                {showColorPicker && (
                  <div className="color-picker-popover">
                    <div 
                      className="color-picker-cover"
                      onClick={() => setShowColorPicker(false)}
                    />
                    <ChromePicker 
                      color={formData.colore}
                      onChange={handleColorChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data_apertura">Data Inizio *</label>
                <input
                  type="date"
                  id="data_apertura"
                  name="data_apertura"
                  value={formData.data_apertura}
                  onChange={handleChange}
                  className={errors.data_apertura ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.data_apertura && (
                  <span className="error-message">{errors.data_apertura}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="data_chiusura">Data Fine *</label>
                <input
                  type="date"
                  id="data_chiusura"
                  name="data_chiusura"
                  value={formData.data_chiusura}
                  onChange={handleChange}
                  className={errors.data_chiusura ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.data_chiusura && (
                  <span className="error-message">{errors.data_chiusura}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="note">Note</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                disabled={isLoading}
                placeholder="Note aggiuntive sulla collezione..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
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
              {isLoading ? 'Salvataggio...' : collezione ? 'Aggiorna' : 'Crea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollezioneForm;
