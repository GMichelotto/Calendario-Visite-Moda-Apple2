import React, { useEffect, useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

export const ClientiList = () => {
  const [clienti, setClienti] = useState([]);
  const { getClienti, addCliente, isLoading, error } = useDatabase();

  useEffect(() => {
    const loadClienti = async () => {
      try {
        const data = await getClienti();
        setClienti(data);
      } catch (err) {
        console.error('Error loading clienti:', err);
      }
    };

    loadClienti();
  }, [getClienti]);

  const handleAddCliente = async (nuovoCliente) => {
    try {
      await addCliente(nuovoCliente);
      // Ricarica la lista dopo l'aggiunta
      const updatedClienti = await getClienti();
      setClienti(updatedClienti);
    } catch (err) {
      console.error('Error adding cliente:', err);
    }
  };

  if (isLoading) return <div>Caricamento...</div>;
  if (error) return <div>Errore: {error}</div>;

  return (
    <div>
      <h2>Lista Clienti</h2>
      <ul>
        {clienti.map(cliente => (
          <li key={cliente.id}>
            {cliente.ragione_sociale} - {cliente.citta}
          </li>
        ))}
      </ul>
      {/* Form per aggiungere nuovi clienti */}
    </div>
  );
};
