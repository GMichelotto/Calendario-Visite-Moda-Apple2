import { useState, useEffect, useCallback } from 'react';
import { Cliente, Collezione, Evento, APIResponse, ValidationResponse } from '../types/database';

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
export const useClienti = () => {
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

  // ... resto del codice con tipi aggiunti ...

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
export const useCollezioni = () => {
  const [collezioni, setCollezioni] = useState<Collezione[]>([]);
  // ... resto del codice con tipi aggiunti ...
};

// Hook per gestire gli eventi
export const useEventi = () => {
  const [eventi, setEventi] = useState<Evento[]>([]);
  // ... resto del codice con tipi aggiunti ...
};

// Aggiungi le definizioni dei tipi per window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      clienti: {
        getAll: () => Promise<APIResponse<Cliente[]>>;
        create: (data: Omit<Cliente, 'id'>) => Promise<APIResponse<Cliente>>;
        update: (id: number, data: Partial<Cliente>) => Promise<APIResponse<Cliente>>;
        delete: (id: number) => Promise<APIResponse<void>>;
      };
      collezioni: {
        getAll: () => Promise<APIResponse<Collezione[]>>;
        create: (data: Omit<Collezione, 'id'>) => Promise<APIResponse<Collezione>>;
        update: (id: number, data: Partial<Collezione>) => Promise<APIResponse<Collezione>>;
        delete: (id: number) => Promise<APIResponse<void>>;
      };
      eventi: {
        getAll: () => Promise<APIResponse<Evento[]>>;
        create: (data: Omit<Evento, 'id'>) => Promise<APIResponse<Evento>>;
        update: (id: number, data: Partial<Evento>) => Promise<APIResponse<Evento>>;
        delete: (id: number) => Promise<APIResponse<void>>;
        validate: (data: any) => Promise<ValidationResponse>;
      };
      import: {
        fromCSV: (type: string, content: string) => Promise<APIResponse<any>>;
      };
      export: {
        toCSV: (type: string) => Promise<APIResponse<string>>;
      };
    };
  }
}
