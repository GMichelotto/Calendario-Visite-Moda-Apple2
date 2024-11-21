import React, { createContext, useContext, useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';

interface DatabaseContextType {
  isReady: boolean;
  executeQuery: (channel: string, ...args: any[]) => Promise<any>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        await ipcRenderer.invoke('db:init');
        setIsReady(true);
      } catch (error) {
        console.error('Errore inizializzazione DB:', error);
      }
    };
    initDb();
  }, []);

  const executeQuery = async (channel: string, ...args: any[]) => {
    if (!isReady) throw new Error('Database non pronto');
    return ipcRenderer.invoke(channel, ...args);
  };

  return (
    <DatabaseContext.Provider value={{ isReady, executeQuery }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase deve essere usato dentro DatabaseProvider');
  return context;
};
