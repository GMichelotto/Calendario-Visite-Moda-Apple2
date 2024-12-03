import { Cliente, Collezione, Evento, APIResponse, ValidationResponse } from './database';

export interface DatabaseOperation {
  operation: (operation: string, ...args: any[]) => Promise<any>;
}

export interface ElectronAPI {
  database: {
    operation: DatabaseOperation['operation'];
  };
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
