import React, { useEffect, useState } from 'react';
import { useDatabase } from '../../hooks/useDatabase';

interface Cliente {
  id: string;
  ragione_sociale: string;
  citta: string;
}

interface ClientiListProps {
  onClienteSelect?: (cliente: Cliente) => void;
  selectedClienteId?: string;
}

export const ClientiList: React.FC<ClientiListProps> = ({ 
  onClienteSelect,
  selectedClienteId 
}) => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const { getClienti, addCliente, isLoading, error } = useDatabase();

  useEffect(() => {
    const loadClienti = async () => {
      try {
        const data = await getClienti();
        setClienti(data);
      } catch (err) {
        console.error('Error loading clienti:', err instanceof Error ? err.message : 'Unknown error');
      }
    };

    loadClienti();
  }, [getClienti]);

  const handleAddCliente = async (nuovoCliente: Omit<Cliente, 'id'>) => {
    try {
      await addCliente(nuovoCliente);
      const updatedClienti = await getClienti();
      setClienti(updatedClienti);
    } catch (err) {
      console.error('Error adding cliente:', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-gray-600">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Errore: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Lista Clienti</h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {clienti.map(cliente => (
          <li 
            key={cliente.id}
            onClick={() => onClienteSelect?.(cliente)}
            className={`
              p-4 hover:bg-gray-50 cursor-pointer transition-colors
              ${selectedClienteId === cliente.id ? 'bg-blue-50' : ''}
            `}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {cliente.ragione_sociale}
                </h3>
                <p className="text-sm text-gray-500">
                  {cliente.citta}
                </p>
              </div>
              {selectedClienteId === cliente.id && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </li>
        ))}
      </ul>
      {clienti.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          Nessun cliente trovato
        </div>
      )}
    </div>
  );
};

export default ClientiList;
