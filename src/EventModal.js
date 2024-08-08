import React, { useState, useEffect } from 'react';
import moment from 'moment';

function EventModal({ event, onClose, onUpdate }) {
  useEffect(() => {
    import('./EventModal.css');
  }, []);

  const [editedEvent, setEditedEvent] = useState({
    ...event,
    start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
    end: moment(event.end).format('YYYY-MM-DDTHH:mm')
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...editedEvent,
      start: new Date(editedEvent.start),
      end: new Date(editedEvent.end)
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Dettagli Evento</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Cliente:
            <input type="text" name="cliente" value={editedEvent.cliente} onChange={handleChange} />
          </label>
          <label>
            Collezione:
            <input type="text" name="collezione" value={editedEvent.collezione} onChange={handleChange} />
          </label>
          <label>
            Inizio:
            <input type="datetime-local" name="start" value={editedEvent.start} onChange={handleChange} />
          </label>
          <label>
            Fine:
            <input type="datetime-local" name="end" value={editedEvent.end} onChange={handleChange} />
          </label>
          <div className="button-group">
            <button type="submit">Aggiorna</button>
            <button type="button" onClick={onClose}>Chiudi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
