import { IpcRenderer } from 'electron';
import { ElectronAPI, ClientiOperations, CollezioniOperations, EventiOperations, DatabaseOperations } from '@shared/types';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    isDev: boolean;
    fs: {
      readFile: (path: string, options?: { encoding?: string }) => Promise<Buffer | string>;
      writeFile: (path: string, data: string) => Promise<void>;
    };
  }
}

export interface IElectronAPI {
  database: DatabaseOperations;
  clienti: ClientiOperations;
  collezioni: CollezioniOperations;
  eventi: EventiOperations;
}

export interface PreloadWindow extends Window {
  ipcRenderer: IpcRenderer;
}

// Expose electron store API
export interface Store {
  get: (key: string) => any;
  set: (key: string, val: any) => void;
  delete: (key: string) => void;
  clear: () => void;
}

declare global {
  interface Window {
    store: Store;
  }
}
