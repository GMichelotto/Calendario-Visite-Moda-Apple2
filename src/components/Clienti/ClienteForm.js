// src/components/Clienti/ClienteForm.js
import React, { useState, useEffect } from 'react';
import { useCollezioni } from '../../hooks/useDatabase';
import './ClienteForm.css';

const ClienteForm = ({ cliente = null, onSubmit, onCancel }) => {
  const { collezioni } = useCollezioni();
  const [formData, setFormData] = useState({
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
    collezioni_ids: []
  });
  const [errors, setErrors] = useState({});

  // Inizializza il form con i dati del cliente se in modalità modifica
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
        collezioni_ids: cliente.collezioni_ids 
          ? cliente.collezioni_ids.split(',').map(Number) 
          : []
      });
    }
  }, [cliente]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ragione_sociale.trim()) {
      newErrors.ragione_sociale = 'La ragione sociale è obbligatoria';
    }

    if (formData.cap && !/^\d{5}$/.test(formData.cap)) {
      newErrors.cap = 'Il CAP deve essere di 5 cifre';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    if (formData.provincia && !/^[A-Z]{2}$/.test(formData.provincia.toUpperCase())) {
      newErrors.provincia = 'La provincia deve essere di 2 lettere';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Converti provincia in maiuscolo
      const submissionData = {
        ...formData,
        provincia: formData.provincia.toUpperCase()
      };
      onSubmit(submissionData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCollezioniChange = (collezioneId) => {
    setFormData(prev => ({
      ...prev,
      collezioni_ids: prev.collezioni_ids.includes(collezioneId)
        ? prev.collezioni_ids.filter(id => id !== collezioneId)
        : [...prev.collezioni_ids, collezioneId]
    }));
  };

  return (
    <div className="cliente-form-container">
      <h2>{cliente ? 'Modifica Cliente' : 'Nuovo Cliente'}</h2>
      <form onSubmit={handleSubmit} className="cliente-form">
        {/* Dati principali */}
        <div className="form-section">
          <h3>Dati Principali</h3>
          <div className="form-group">
            <label htmlFor="ragione_sociale">Ragione Sociale *</label>
            <input
              type="text"
              id="ragione_sociale"
              name="ragione_sociale"
              value={formData.ragione_sociale}
              onChange={handleChange}
              className={errors.ragione_sociale ? 'error' : ''}
            />
            {errors.ragione_sociale && (
              <span className="error-message">{errors.ragione_sociale}</span>
            )}
          </div>
        </div>

        {/* Indirizzo */}
        <div className="form-section">
          <h3>Indirizzo</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="indirizzo">Indirizzo</label>
              <input
                type="text"
                id="indirizzo"
                name="indirizzo"
                value={formData.indirizzo}
                onChange={handleChange}
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
              />
              {errors.cap && <span className="error-message">{errors.cap}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="citta">Città</label>
              <input
                type="text"
                id="citta"
                name="citta"
                value={formData.citta}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="provincia">Provincia</label>
              <input
                type="text"
                id="provincia"
                name="provincia"
                value={formData.provincia}
