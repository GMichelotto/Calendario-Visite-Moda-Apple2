import React, { useState } from 'react';

interface ClientCollectionDurationProps {
  collezione_id: number;
  cliente_id: number;
  initialDuration?: number;
  onSave: (duration: number) => Promise<void>;
}

const ClientCollectionDuration: React.FC<ClientCollectionDurationProps> = ({
  collezione_id,
  cliente_id,
  initialDuration = 120,
  onSave
}) => {
  const [duration, setDuration] = useState<number>(initialDuration);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const validateDuration = (value: number | string): boolean => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numValue) || numValue < 60 || numValue > 240) {
      setError('La durata deve essere tra 60 e 240 minuti');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = e.target.value;
    setDuration(parseInt(newDuration, 10));
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
            <button 
              onClick={handleSave} 
              className="save-button"
              type="button"
            >
              ✓
            </button>
            <button 
              onClick={() => setIsEditing(false)} 
              className="cancel-button"
              type="button"
            >
              ✕
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="duration-display" onClick={() => setIsEditing(true)}>
          {duration} min
          <button 
            className="edit-button"
            type="button"
          >
            ✏️
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientCollectionDuration;
