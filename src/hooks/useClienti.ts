// src/hooks/useClienti.ts
import { useState, useCallback } from 'react';
import ClientService from '../services/database/ClientService';
import { Cliente } from '../types/database';
import { AppError } from '../types/errors';

type ClienteHookActions = {
  createCliente: (clienteData: Omit<Cliente, 'id'>) => Promise<Cliente | null>;
  updateCliente: (id: number, clienteData: Partial<Cliente>) => Promise<boolean>;
  deleteCliente: (id: number) => Promise<boolean>;
  refreshClienti: () => Promise<void>;
};

type ClienteHookState = {
  clienti: Cliente[];
  isLoading: boolean;
  error: string | null;
};

type ClienteHookReturn = ClienteHookState & ClienteHookActions;

export function useClienti() {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const createCliente = useCallback(async (clienteData: Omit<Cliente, 'id'>): Promise<Cliente | null> => {
    setError(null);
    try {
      const result = await ClientService.create(clienteData);
      if (result) {
        setClienti(prev => [...prev, result]);
        return result;
      }
      return null;
    } catch (e) {
      setError(e instanceof AppError ? e.message : 'Errore nella creazione del cliente');
      return null;
    }
  }, []);

  const updateCliente = useCallback(async (id: number, clienteData: Partial<Cliente>): Promise<boolean> => {
    setError(null);
    try {
      const success = await ClientService.update(id, clienteData);
      if (success) {
        setClienti(prev => prev.map(cliente => 
          cliente.id === id ? { ...cliente, ...clienteData } : cliente
        ));
      }
      return success;
    } catch (e) {
      setError(e instanceof AppError ? e.message : 'Errore nell\'aggiornamento del cliente');
      return false;
    }
  }, []);

  const deleteCliente = useCallback(async (id: number): Promise<boolean> => {
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

  const hookReturn = {
    clienti,
    isLoading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    refreshClienti: fetchClienti,
  } satisfies ClienteHookReturn;

  return hookReturn;
}

// Esporta il tipo per l'uso nei componenti
export type UseClientiType = ReturnType<typeof useClienti>;
