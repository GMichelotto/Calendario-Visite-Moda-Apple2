import { useState, useEffect, useCallback } from 'react';
import type { Cliente, Collezione, Evento, APIResponse } from '@shared/types';
export { useDatabase } from '../contexts/DatabaseContext';

// Definizione dei tipi di ritorno per gli hooks
interface UseClientiReturn {
  clienti: Cliente[];
  isLoading: boolean;
  error: string | null;
  createCliente: (clienteData: Omit<Cliente, 'id'>) => Promise<Cliente | null>;
  updateCliente: (id: number, clienteData: Partial<Cliente>) => Promise<Cliente | null>;
  deleteCliente: (id: number) => Promise<void | null>;
  refreshClienti: () => Promise<void>;
}

interface UseCollezioniReturn {
  collezioni: Collezione[];
  isLoading: boolean;
  error: string | null;
  createCollezione: (collezioneData: Omit<Collezione, 'id'>) => Promise<Collezione | null>;
  updateCollezione: (id: number, collezioneData: Partial<Collezione>) => Promise<Collezione | null>;
  deleteCollezione: (id: number) => Promise<void | null>;
  refreshCollezioni: () => Promise<void>;
}

interface UseEventiReturn {
  eventi: Evento[];
  isLoading: boolean;
  error: string | null;
  createEvento: (eventoData: Omit<Evento, 'id'>) => Promise<Evento | null>;
  updateEvento: (id: number, eventoData: Partial<Evento>) => Promise<Evento | null>;
  deleteEvento: (id: number) => Promise<void | null>;
  refreshEventi: () => Promise<void>;
}

// Hook generico per gestire loading e errori
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

// Hook per gestire i clienti
export const useClienti = (): UseClientiReturn => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const { isLoading, error, execute } = useAsyncOperation();

  const fetchClienti = useCallback(async () => {
    const result = await execute<APIResponse<Cliente[]>>(async () => {
      const response = await window.electronAPI.clienti.getAll();
      if (!response.success) throw new Error(response.error);
      return response;
    });
    if (result?.data) setClienti(result.data);
  }, [execute]);

  const createCliente = useCallback(async (clienteData: Omit<Cliente, 'id'>) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.create(clienteData);
      if (!response.success) throw new Error(response.error);
      await fetchClienti();
      return response.data;
    });
  }, [execute, fetchClienti]);

  const updateCliente = useCallback(async (id: number, clienteData: Partial<Cliente>) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.update(id, clienteData);
      if (!response.success) throw new Error(response.error);
      await fetchClienti();
      return response.data;
    });
  }, [execute, fetchClienti]);

  const deleteCliente = useCallback(async (id: number) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.delete(id);
      if (!response.success) throw new Error(response.error);
      await fetchClienti();
      return response.data;
    });
  }, [execute, fetchClienti]);

  useEffect(() => {
    fetchClienti();
  }, [fetchClienti]);

  return {
    clienti,
    isLoading,
    error,
    createCliente,
    updateCliente,
    deleteCliente,
    refreshClienti: fetchClienti
  };
};

// Hook per gestire le collezioni
export const useCollezioni = (): UseCollezioniReturn => {
  const [collezioni, setCollezioni] = useState<Collezione[]>([]);
  const { isLoading, error, execute } = useAsyncOperation();

  const fetchCollezioni = useCallback(async () => {
    const result = await execute<APIResponse<Collezione[]>>(async () => {
      const response = await window.electronAPI.collezioni.getAll();
      if (!response.success) throw new Error(response.error);
      return response;
    });
    if (result?.data) setCollezioni(result.data);
  }, [execute]);

  const createCollezione = useCallback(async (collezioneData: Omit<Collezione, 'id'>) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.create(collezioneData);
      if (!response.success) throw new Error(response.error);
      await fetchCollezioni();
      return response.data;
    });
  }, [execute, fetchCollezioni]);

  const updateCollezione = useCallback(async (id: number, collezioneData: Partial<Collezione>) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.update(id, collezioneData);
      if (!response.success) throw new Error(response.error);
      await fetchCollezioni();
      return response.data;
    });
  }, [execute, fetchCollezioni]);

  const deleteCollezione = useCallback(async (id: number) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.delete(id);
      if (!response.success) throw new Error(response.error);
      await fetchCollezioni();
      return response.data;
    });
  }, [execute, fetchCollezioni]);

  useEffect(() => {
    fetchCollezioni();
  }, [fetchCollezioni]);

  return {
    collezioni,
    isLoading,
    error,
    createCollezione,
    updateCollezione,
    deleteCollezione,
    refreshCollezioni: fetchCollezioni
  };
};

// Hook per gestire gli eventi
export const useEventi = (): UseEventiReturn => {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const { isLoading, error, execute } = useAsyncOperation();

  const fetchEventi = useCallback(async () => {
    const result = await execute<APIResponse<Evento[]>>(async () => {
      const response = await window.electronAPI.eventi.getAll();
      if (!response.success) throw new Error(response.error);
      return response;
    });
    if (result?.data) setEventi(result.data);
  }, [execute]);

  const createEvento = useCallback(async (eventoData: Omit<Evento, 'id'>) => {
    return await execute(async () => {
      const response = await window.electronAPI.eventi.create(eventoData);
      if (!response.success) throw new Error(response.error);
      await fetchEventi();
      return response.data;
    });
  }, [execute, fetchEventi]);

  const updateEvento = useCallback(async (id: number, eventoData: Partial<Evento>) => {
    return await execute(async () => {
      const response = await window.electronAPI.eventi.update(id, eventoData);
      if (!response.success) throw new Error(response.error);
      await fetchEventi();
      return response.data;
    });
  }, [execute, fetchEventi]);

  const deleteEvento = useCallback(async (id: number) => {
    return await execute(async () => {
      const response = await window.electronAPI.eventi.delete(id);
      if (!response.success) throw new Error(response.error);
      await fetchEventi();
      return response.data;
    });
  }, [execute, fetchEventi]);

  useEffect(() => {
    fetchEventi();
  }, [fetchEventi]);

  return {
    eventi,
    isLoading,
    error,
    createEvento,
    updateEvento,
    deleteEvento,
    refreshEventi: fetchEventi
  };
};
