// src/hooks/useClienti.ts
import { useState, useCallback } from 'react';
import ClientService from '../services/database/ClientService';
import { Cliente } from '../types/database';
import { AppError } from '../types/errors';
import { 
  UseClientiReturn,
  CreateClienteFn,
  UpdateClienteFn,
  DeleteClienteFn
} from '../types/clientTypes';

export function useClienti(): UseClientiReturn {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClienti = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ClientService.getAll();
      setClienti(data);
    } catch (e) {
      setError(e instanceof AppError ? e.message : 'Errore nel caricamento dei clienti');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCliente: CreateClienteFn = useCallback(async (clienteData) => {
    setError(null);
    try {
      const newCliente = await ClientService.create(clienteData);
      if (newCliente) {
        setClienti(prev => [...prev, newCliente]);
        return newCliente;
      }
      return null;
    } catch (e) {
      setError(e instanceof AppError ? e.message : 'Errore nella creazione del cliente');
      return null;
    }
  }, []);

  const updateCliente: UpdateClienteFn = useCallback(async (id, clienteData) => {
    setError(null);
    try {
      const success = await ClientService.update(id, clienteData);
      if (success) {
        setClienti(prev => prev.map(cliente => 
          cliente.id === id ? { ...cliente, ...clienteData, id } : cliente
        ));
      }
      return success;
    } catch (e) {
      setError(e instanceof AppError ? e.message : 'Errore nell\'aggiornamento del cliente');
      return false;
    }
  }, []);

  const deleteCliente: DeleteClienteFn = useCallback(async (id) => {
    setError(null);
    try {
      const success = await ClientService.delete(id);
      if (success) {
        setClienti(prev => prev.filter(cliente => cliente.id !== id));
      }
      return success;
    } catch (e) {
      setError(e instanceof AppError ? e.message : 'Errore nell\'eliminazione del cliente');
      return false;
    }
  }, []);

  return {
    clienti,
    isLoading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    refreshClienti: fetchClienti
  };
}
