// src/components/Collezioni/ClientCollectionDuration.js
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../hooks/useDatabase';

const ClientCollectionDuration = ({ collezione_id, cliente_id, initialDuration = 120, onSave }) => {
  const [duration, setDuration] = useState(initialDuration);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);

  const validateDuration = (value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 60 || numValue > 240) {
      setError('La durata deve essere tra 60 e 240 minuti');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDurationChange = (e) => {
    const newDuration = e.target.value;
    setDuration(newDuration);
    validateDuration(newDuration);
  };

  const handleSave = async () => {
    if (validateDuration(duration)) {
      await onSave(duration);
      setIsEditing(false);
    }
  };

  return (
    <div className="duration-editor">
      {isEditing ? (
        <div className="duration-input-group">
          <input
            type="number"
            min="60"
            max="240"
            step="30"
            value={duration}
            onChange={handleDurationChange}
            className={error ? 'error' : ''}
          />
          <div className="duration-actions">
            <button onClick={handleSave} className="save-button">
              ✓
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">
              ✕
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="duration-display" onClick={() => setIsEditing(true)}>
          {duration} min
          <button className="edit-button">✏️</button>
        </div>
      )}
    </div>
  );
};

export default ClientCollectionDuration;
