// src/components/Clienti/ClienteForm.tsx
import React, { useState, useEffect } from 'react';
import { useCollezioni } from '../../hooks/useDatabase';
import type { Cliente, Collezione } from '@shared/types';
import './ClienteForm.css';

interface ClienteFormProps {
  cliente?: Cliente | null;
  onSubmit: (cliente: Omit<Cliente, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  ragione_sociale: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  regione: string;
  telefono: string;
  cellulare: string;
  email: string;
  sito_web: string;
  collezioni: string[];  // Array di stringhe per gli ID delle collezioni
}

interface FormErrors {
  ragione_sociale?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  cellulare?: string;
  email?: string;
  sito_web?: string;
}

const initialFormData: FormData = {
  ragione_sociale: '',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  regione: '',
  telefono: '',
  cellulare: '',
  email: '',
  sito_web: '',
  collezioni: []
};

const ClienteForm: React.FC<ClienteFormProps> = ({ 
  cliente = null, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const { collezioni } = useCollezioni();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (cliente) {
      setFormData({
        ragione_sociale: cliente.ragione_sociale || '',
        indirizzo: cliente.indirizzo || '',
        cap: cliente.cap || '',
        citta: cliente.citta || '',
        provincia: cliente.provincia || '',
        regione: cliente.regione || '',
        telefono: cliente.telefono || '',
        cellulare: cliente.cellulare || '',
        email: cliente.email || '',
        sito_web: cliente.sito_web || '',
        collezioni: cliente.collezioni || []
      });
    }
  }, [cliente]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.ragione_sociale.trim()) {
      newErrors.ragione_sociale = 'La ragione sociale è obbligatoria';
    }

    if (formData.cap && !/^\d{5}$/.test(formData.cap)) {
      newErrors.cap = 'Il CAP deve essere di 5 cifre';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato email non valido';
    }

    if (formData.provincia && !/^[A-Z]{2}$/.test(formData.provincia.toUpperCase())) {
      newErrors.provincia = 'La provincia deve essere di 2 lettere';
    }

    if (formData.telefono && !/^[\d\s+-]{5,20}$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato telefono non valido';
    }

    if (formData.cellulare && !/^[\d\s+-]{5,20}$/.test(formData.cellulare)) {
      newErrors.cellulare = 'Formato cellulare non valido';
    }

    if (formData.sito_web && !/^https?:\/\/.+/.test(formData.sito_web)) {
      newErrors.sito_web = 'Il sito web deve iniziare con http:// o https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        provincia: formData.provincia.toUpperCase(),
        cap: formData.cap.trim(),
        telefono: formData.telefono.trim(),
        cellulare: formData.cellulare.trim()
      };
      onSubmit(submitData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCollezioniChange = (collezioneId: string) => {
    setFormData(prev => ({
      ...prev,
      collezioni: prev.collezioni.includes(collezioneId)
        ? prev.collezioni.filter(id => id !== collezioneId)
        : [...prev.collezioni, collezioneId]
    }));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal cliente-form-modal">
        <div className="modal-header">
          <h2>{cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cliente-form">
          {/* Sezione Dati Principali */}
          <div className="form-section">
            <h3>Dati Principali</h3>
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="ragione_sociale">
                  Ragione Sociale *
                </label>
                <input
                  type="text"
                  id="ragione_sociale"
                  name="ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={handleChange}
                  className={errors.ragione_sociale ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.ragione_sociale && (
                  <span className="error-message">{errors.ragione_sociale}</span>
                )}
              </div>
            </div>
          </div>

          {/* Sezione Indirizzo */}
          <div className="form-section">
            <h3>Indirizzo</h3>
            <div className="form-row">
              <div className="form-group flex-grow">
                <label htmlFor="indirizzo">Indirizzo</label>
                <input
                  type="text"
                  id="indirizzo"
                  name="indirizzo"
                  value={formData.indirizzo}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cap">CAP</label>
                <input
                  type="text"
                  id="cap"
                  name="cap"
                  value={formData.cap}
                  onChange={handleChange}
                  className={errors.cap ? 'error' : ''}
                  maxLength={5}
                  disabled={isLoading}
                />
                {errors.cap && <span className="error-message">{errors.cap}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group flex-grow">
                <label htmlFor="citta">Città</label>
                <input
                  type="text"
                  id="citta"
                  name="citta"
                  value={formData.citta}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="provincia">Provincia</label>
                <input
                  type="text"
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleChange}
                  className={errors.provincia ? 'error' : ''}
                  maxLength={2}
                  style={{ textTransform: 'uppercase' }}
                  disabled={isLoading}
                />
                {errors.provincia && (
                  <span className="error-message">{errors.provincia}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="regione">Regione</label>
                <input
                  type="text"
                  id="regione"
                  name="regione"
                  value={formData.regione}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Sezione Contatti */}
          <div className="form-section">
            <h3>Contatti</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefono">Telefono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className={errors.telefono ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.telefono && (
                  <span className="error-message">{errors.telefono}</span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="cellulare">Cellulare</label>
                <input
                  type="tel"
                  id="cellulare"
                  name="cellulare"
                  value={formData.cellulare}
                  onChange={handleChange}
                  className={errors.cellulare ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.cellulare && (
                  <span className="error-message">{errors.cellulare}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-grow">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>
              <div className="form-group flex-grow">
                <label htmlFor="sito_web">Sito Web</label>
                <input
                  type="url"
                  id="sito_web"
                  name="sito_web"
                  value={formData.sito_web}
                  onChange={handleChange}
                  className={errors.sito_web ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.sito_web && (
                  <span className="error-message">{errors.sito_web}</span>
                )}
              </div>
            </div>
          </div>

          {/* Sezione Collezioni */}
          <div className="form-section">
            <h3>Collezioni</h3>
            <div className="collezioni-grid">
              {collezioni.map((collezione: Collezione) => (
                <label key={collezione.id} className="collezione-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.collezioni.includes(collezione.id)}
                    onChange={() => handleCollezioniChange(collezione.id)}
                    disabled={isLoading}
                  />
                  <span 
                    className="collezione-name"
                    style={{ backgroundColor: collezione.colore + '20' }}
                  >
                    {collezione.nome}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer con bottoni */}
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
              {isLoading ? 'Salvataggio...' : cliente ? 'Aggiorna' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteForm;
