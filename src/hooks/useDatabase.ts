import { useState, useEffect, useCallback } from 'react';
import { Cliente, Collezione, Evento, APIResponse } from '../types/database';

interface UseDatabaseReturn {
  clienti: Cliente[];
  collezioni: Collezione[];
  eventi: Evento[];
  isLoading: boolean;
  error: string | null;
  createCliente: (clienteData: Omit<Cliente, 'id'>) => Promise<Cliente | null>;
  updateCliente: (id: number, clienteData: Partial<Cliente>) => Promise<Cliente | null>;
  deleteCliente: (id: number) => Promise<void | null>;
  createCollezione: (collezioneData: Omit<Collezione, 'id'>) => Promise<Collezione | null>;
  updateCollezione: (id: number, collezioneData: Partial<Collezione>) => Promise<Collezione | null>;
  deleteCollezione: (id: number) => Promise<void | null>;
  createEvento: (eventoData: Omit<Evento, 'id'>) => Promise<Evento | null>;
  updateEvento: (id: number, eventoData: Partial<Evento>) => Promise<Evento | null>;
  deleteEvento: (id: number) => Promise<void | null>;
  refreshData: () => Promise<void>;
}

const useAsyncOperation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
};

export const useDatabase = (): UseDatabaseReturn => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [collezioni, setCollezioni] = useState<Collezione[]>([]);
  const [eventi, setEventi] = useState<Evento[]>([]);
  const { isLoading, error, execute } = useAsyncOperation();

  const fetchData = useCallback(async () => {
    const [clientiResult, collezioniResult, eventiResult] = await Promise.all([
      execute<APIResponse<Cliente[]>>(window.electronAPI.clienti.getAll),
      execute<APIResponse<Collezione[]>>(window.electronAPI.collezioni.getAll),
      execute<APIResponse<Evento[]>>(window.electronAPI.eventi.getAll),
    ]);

    if (clientiResult?.data) setClienti(clientiResult.data);
    if (collezioniResult?.data) setCollezioni(collezioniResult.data);
    if (eventiResult?.data) setEventi(eventiResult.data);
  }, [execute]);

  const createCliente = useCallback(async (clienteData: Omit<Cliente, 'id'>) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.create(clienteData);
      if (!response.success) throw new Error(response.error);
      await fetchData();
      return response.data;
    });
  }, [execute, fetchData]);

  const updateCliente = useCallback(async (id: number, clienteData: Partial<Cliente>) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.update(id, clienteData);
      if (!response.success) throw new Error(response.error);
      await fetchData();
      return response.data;
    });
  }, [execute, fetchData]);

  const deleteCliente = useCallback(async (id: number) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.delete(id);
      if (!response.success) throw new Error(response.error);
      await fetchData();
    });
  }, [execute, fetchData]);

  const createCollezione = useCallback(async (collezioneData: Omit<Collezione, 'id'>) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.create(collezioneData);
      if (!response.success) throw new Error(response.error);
      await fetchData();
      return response.data;
    });
  }, [execute, fetchData]);

  const updateCollezione = useCallback(async (id: number, collezioneData: Partial<Collezione>) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.update(id, collezioneData);
      if (!response.success) throw new Error(response.error);
      await fetchData();
      return response.data;
    });
  }, [execute, fetchData]);

  const deleteCollezione = useCallback(async (id: number) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.delete(id);
      if (!response.success) throw new Error(response.error);
      await fetchData();
    });
  }, [execute, fetchData]);

  const createEvento = useCallback(async (eventoData: Omit<Evento, 'id'>) => {
    return await execute(async () => {
      const response = await window.electronAPI.eventi.create(eventoData);
      if (!response.success) throw new Error(response.error);
      await fetchData();
      return response.data;
    });
  }, [execute, fetchData]);

  const updateEvento = useCallback(async (id: number, eventoData: Partial<Evento>) => {
    return await execute(async () => {
      const response = await window.electronAPI.eventi.update(id, eventoData);
      if (!response.success) throw new Error(response.error);
      await fetchData();
      return response.data;
    });
  }, [execute, fetchData]);

  const deleteEvento = useCallback(async (id: number) => {
    return await execute(async () => {
      const response = await window.electronAPI.eventi.delete(id);
      if (!response.success) throw new Error(response.error);
      await fetchData();
    });
  }, [execute, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    clienti,
    collezioni,
    eventi,
    isLoading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    createCollezione,
    updateCollezione,
    deleteCollezione,
    createEvento,
    updateEvento,
    deleteEvento,
    refreshData: fetchData,
  };
};
