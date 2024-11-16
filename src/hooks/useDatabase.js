// src/hooks/useDatabase.js
import { useState, useEffect, useCallback } from 'react';

// Hook generico per gestire loading e errori
const useAsyncOperation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (operation) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await operation();
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, execute };
};

// Hook per gestire i clienti
export const useClienti = () => {
  const [clienti, setClienti] = useState([]);
  const { isLoading, error, execute } = useAsyncOperation();

  const fetchClienti = useCallback(async () => {
    const result = await execute(async () => {
      const response = await window.electronAPI.clienti.getAll();
      if (!response.success) throw new Error(response.error);
      return response.data;
    });
    if (result) setClienti(result);
  }, [execute]);

  const createCliente = useCallback(async (clienteData) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.create(clienteData);
      if (!response.success) throw new Error(response.error);
      await fetchClienti();
      return response.data;
    });
  }, [execute, fetchClienti]);

  const updateCliente = useCallback(async (id, clienteData) => {
    return await execute(async () => {
      const response = await window.electronAPI.clienti.update(id, clienteData);
      if (!response.success) throw new Error(response.error);
      await fetchClienti();
      return response.data;
    });
  }, [execute, fetchClienti]);

  const deleteCliente = useCallback(async (id) => {
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
export const useCollezioni = () => {
  const [collezioni, setCollezioni] = useState([]);
  const { isLoading, error, execute } = useAsyncOperation();

  const fetchCollezioni = useCallback(async () => {
    const result = await execute(async () => {
      const response = await window.electronAPI.collezioni.getAll();
      if (!response.success) throw new Error(response.error);
      return response.data;
    });
    if (result) setCollezioni(result);
  }, [execute]);

  const createCollezione = useCallback(async (collezioneData) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.create(collezioneData);
      if (!response.success) throw new Error(response.error);
      await fetchCollezioni();
      return response.data;
    });
  }, [execute, fetchCollezioni]);

  const updateCollezione = useCallback(async (id, collezioneData) => {
    return await execute(async () => {
      const response = await window.electronAPI.collezioni.update(id, collezioneData);
      if (!response.success) throw new Error(response.error);
      await fetchCollezioni();
      return response.data;
    });
  }, [execute, fetchCollezioni]);

  const deleteCollezione = useCallback(async (id) => {
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
export const useEventi = () => {
  const [eventi, setEventi] = useState([]);
  const { isLoading, error, execute } = useAsyncOperation();

  const fetchEventi = useCallback(async () => {
    const result = await execute(async () => {
      const response = await window.electronAPI.eventi.getAll();
      if (!response.success) throw new Error(response.error);
      return response.data;
    });
    if (result) setEventi(result);
  }, [execute]);

  const createEvento = useCallback(async (eventoData) => {
    return await execute(async () => {
      // Validate event before creating
      const validationResponse = await window.electronAPI.eventi.validate({
        start: eventoData.data_inizio,
        end: eventoData.data_fine,
        collezione_id: eventoData.collezione_id
      });
      
      if (!validationResponse.success) throw new Error(validationResponse.error);
      if (!validationResponse.data.isValid) {
        throw new Error('Evento non valido: controlla date e sovrapposizioni');
      }

      const response = await window.electronAPI.eventi.create(eventoData);
      if (!response.success) throw new Error(response.error);
      await fetchEventi();
      return response.data;
    });
  }, [execute, fetchEventi]);

  const updateEvento = useCallback(async (id, eventoData) => {
    return await execute(async () => {
      // Validate event before updating
      const validationResponse = await window.electronAPI.eventi.validate({
        start: eventoData.data_inizio,
        end: eventoData.data_fine,
        collezione_id: eventoData.collezione_id,
        excludeId: id
      });
      
      if (!validationResponse.success) throw new Error(validationResponse.error);
      if (!validationResponse.data.isValid) {
        throw new Error('Evento non valido: controlla date e sovrapposizioni');
      }

      const response = await window.electronAPI.eventi.update(id, eventoData);
      if (!response.success) throw new Error(response.error);
      await fetchEventi();
      return response.data;
    });
  }, [execute, fetchEventi]);

  const deleteEvento = useCallback(async (id) => {
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

// Hook per gestire import/export
export const useDataIO = () => {
  const { isLoading, error, execute } = useAsyncOperation();

  const importFromCSV = useCallback(async (type, content) => {
    return await execute(async () => {
      const response = await window.electronAPI.import.fromCSV(type, content);
      if (!response.success) throw new Error(response.error);
      return response.data;
    });
  }, [execute]);

  const exportToCSV = useCallback(async (type) => {
    return await execute(async () => {
      const response = await window.electronAPI.export.toCSV(type);
      if (!response.success) throw new Error(response.error);
      return response.data;
    });
  }, [execute]);

  return {
    isLoading,
    error,
    importFromCSV,
    exportToCSV
  };
};
