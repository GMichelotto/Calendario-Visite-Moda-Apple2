import { useState, useCallback } from 'react';
import { databaseService } from '../services/databaseService';

export const useDatabase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clienti
  const getClienti = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.getClienti();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCliente = useCallback(async (cliente) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.addCliente(cliente);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Collezioni
  const getCollezioni = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.getCollezioni();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCollezione = useCallback(async (collezione) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.addCollezione(collezione);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Eventi
  const getEventi = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.getEventi();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEvento = useCallback(async (evento) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await databaseService.addEvento(evento);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getClienti,
    addCliente,
    getCollezioni,
    addCollezione,
    getEventi,
    addEvento
  };
};
