import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';

const styles = `
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
}

.modal h2 {
  margin-top: 0;
}

.modal form {
  display: flex;
  flex-direction: column;
}

.modal label {
  margin-bottom: 10px;
}

.modal input {
  width: 100%;
  padding: 5px;
  margin-top: 5px;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.button-group button {
  padding: 5px 10px;
  cursor: pointer;
}

.error-message {
  color: red;
  font-size: 0.8em;
  margin-top: 5px;
}
`;

function EventModal({ event, onClose, onUpdate, collezioni }) {
  const [editedEvent, setEditedEvent] = useState({
    ...event,
    start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
    end: moment(event.end).format('YYYY-MM-DDTHH:mm')
  });
  const [error, setError] = useState('');

  const validateEvent = useCallback((event) => {
    const start = moment(event.start);
    const end = moment(event.end);
    
    if (start.day() === 0 || start.day() === 6 || end.day() === 0 || end.day() === 6) {
      return 'Gli eventi devono essere programmati dal lunedì al venerdì.';
    }

    const startHour = start.hour();
    const endHour = end.hour();
    if ((startHour < 9 || startHour >= 18 || (startHour >= 13 && startHour < 14)) ||
        (endHour < 9 || endHour > 18 || (endHour > 13 && endHour <= 14))) {
      return 'Gli eventi devono essere programmati dalle 9:00 alle 13:00 e dalle 14:00 alle 18:00.';
    }

    const collezione = collezioni.find(c => c.Collezioni === event.collezione);
    if (collezione) {
      const collectionStart = moment(collezione['Data Inizio'], 'DD/MM/YYYY');
      const collectionEnd = moment(collezione['Data Fine'], 'DD/MM/YYYY');
      if (start.isBefore(collectionStart) || end.isAfter(collectionEnd)) {
        return 'L\'evento deve essere all\'interno del periodo della collezione.';
      }
    }

    return null;
  }, [collezioni]);

  useEffect(() => {
    const errorMessage = validateEvent(editedEvent);
    setError(errorMessage || '');
  }, [editedEvent, validateEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errorMessage = validateEvent(editedEvent);
    if (!errorMessage) {
      onUpdate({
        ...editedEvent,
        start: new Date(editedEvent.start),
        end: new Date(editedEvent.end)
      });
    } else {
      setError(errorMessage);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="modal-backdrop">
        <div className="modal">
          <h2>Dettagli Evento</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Cliente:
              <input type="text" name="cliente" value={editedEvent.cliente} onChange={handleChange} readOnly />
            </label>
            <label>
              Collezione:
              <input type="text" name="collezione" value={editedEvent.collezione} onChange={handleChange} readOnly />
            </label>
            <label>
              Inizio:
              <input type="datetime-local" name="start" value={editedEvent.start} onChange={handleChange} />
            </label>
            <label>
              Fine:
              <input type="datetime-local" name="end" value={editedEvent.end} onChange={handleChange} />
            </label>
            {error && <div className="error-message">{error}</div>}
            <div className="button-group">
              <button type="submit">Aggiorna</button>
              <button type="button" onClick={onClose}>Chiudi</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default EventModal;
