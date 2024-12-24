// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

// Definizione dei canali IPC permessi
const validChannels = [
  // Canali esistenti
  'clienti:getAll',
  'clienti:getAllWithCollezioni',
  'clienti:getById',
  'clienti:create',
  'clienti:update',
  'clienti:delete',
  'clienti:assignCollezione',
  'clienti:removeCollezione',
  'clienti:importCSV',
  
  'collezioni:getAll',
  'collezioni:getAllWithStats',
  'collezioni:getById',
  'collezioni:create',
  'collezioni:update',
  'collezioni:delete',
  'collezioni:getClienti',
  'collezioni:checkAvailability',
  'collezioni:importCSV',
  
  'eventi:getAll',
  'eventi:getByDateRange',
  'eventi:create',
  'eventi:update',
  'eventi:delete',
  'eventi:validate',
  'eventi:getByCliente',
  'eventi:getByCollezione',

  // Nuovi canali per le migrazioni
  'database:getCurrentVersion',
  'database:migrate',
  'database:rollback'
] as const;

type ValidChannel = typeof validChannels[number];

// Interfaccia per le operazioni del database
interface DatabaseOperations {
  getCurrentVersion: () => Promise<number>;
  migrate: () => Promise<number>;
  rollback: (targetVersion?: number) => Promise<number>;
}

// Interfaccia per i client operations
interface ClientiOperations {
  getAll: () => Promise<any[]>;
  getAllWithCollezioni: () => Promise<any[]>;
  getById: (id: number) => Promise<any>;
  create: (cliente: any) => Promise<any>;
  update: (id: number, cliente: any) => Promise<boolean>;
  delete: (id: number) => Promise<boolean>;
  assignCollezione: (clienteId: number, collezioneId: number) => Promise<boolean>;
  removeCollezione: (clienteId: number, collezioneId: number) => Promise<boolean>;
  importCSV: (content: string) => Promise<{ success: boolean; errors: string[] }>;
}

// Interfaccia per le operazioni sulle collezioni
interface CollezioniOperations {
  getAll: () => Promise<any[]>;
  getAllWithStats: () => Promise<any[]>;
  getById: (id: number) => Promise<any>;
  create: (collezione: any) => Promise<any>;
  update: (id: number, collezione: any) => Promise<boolean>;
  delete: (id: number) => Promise<boolean>;
  getClienti: (id: number) => Promise<any[]>;
  checkAvailability: (id: number, start: Date, end: Date) => Promise<boolean>;
  importCSV: (content: string) => Promise<{ success: boolean; errors: string[] }>;
}

// Interfaccia per le operazioni sugli eventi
interface EventiOperations {
  getAll: () => Promise<any[]>;
  getByDateRange: (start: Date, end: Date) => Promise<any[]>;
  create: (evento: any) => Promise<any>;
  update: (id: number, evento: any) => Promise<boolean>;
  delete: (id: number) => Promise<boolean>;
  validate: (evento: any) => Promise<{ isValid: boolean; errors: string[] }>;
  getByCliente: (clienteId: number) => Promise<any[]>;
  getByCollezione: (collezioneId: number) => Promise<any[]>;
}

// Interfaccia globale per l'API electron
interface ElectronAPI {
  database: DatabaseOperations;
  clienti: ClientiOperations;
  collezioni: CollezioniOperations;
  eventi: EventiOperations;
}

// Helper per verificare se un canale è valido
function isValidChannel(channel: string): channel is ValidChannel {
  return validChannels.includes(channel as ValidChannel);
}

// Funzione sicura per invocare IPC
async function invokeIPC(channel: string, ...args: any[]): Promise<any> {
  if (isValidChannel(channel)) {
    return await ipcRenderer.invoke(channel, ...args);
  }
  throw new Error(`Canale IPC non autorizzato: ${channel}`);
}

// Espone l'API al processo di rendering
contextBridge.exposeInMainWorld('electronAPI', {
  database: {
    getCurrentVersion: () => invokeIPC('database:getCurrentVersion'),
    migrate: () => invokeIPC('database:migrate'),
    rollback: (targetVersion?: number) => invokeIPC('database:rollback', targetVersion)
  },
  clienti: {
    getAll: () => invokeIPC('clienti:getAll'),
    getAllWithCollezioni: () => invokeIPC('clienti:getAllWithCollezioni'),
    getById: (id: number) => invokeIPC('clienti:getById', id),
    create: (cliente: any) => invokeIPC('clienti:create', cliente),
    update: (id: number, cliente: any) => invokeIPC('clienti:update', id, cliente),
    delete: (id: number) => invokeIPC('clienti:delete', id),
    assignCollezione: (clienteId: number, collezioneId: number) =>
      invokeIPC('clienti:assignCollezione', clienteId, collezioneId),
    removeCollezione: (clienteId: number, collezioneId: number) =>
      invokeIPC('clienti:removeCollezione', clienteId, collezioneId),
    importCSV: (content: string) => invokeIPC('clienti:importCSV', content)
  },
  collezioni: {
    getAll: () => invokeIPC('collezioni:getAll'),
    getAllWithStats: () => invokeIPC('collezioni:getAllWithStats'),
    getById: (id: number) => invokeIPC('collezioni:getById', id),
    create: (collezione: any) => invokeIPC('collezioni:create', collezione),
    update: (id: number, collezione: any) => invokeIPC('collezioni:update', id, collezione),
    delete: (id: number) => invokeIPC('collezioni:delete', id),
    getClienti: (id: number) => invokeIPC('collezioni:getClienti', id),
    checkAvailability: (id: number, start: Date, end: Date) =>
      invokeIPC('collezioni:checkAvailability', id, start, end),
    importCSV: (content: string) => invokeIPC('collezioni:importCSV', content)
  },
  eventi: {
    getAll: () => invokeIPC('eventi:getAll'),
    getByDateRange: (start: Date, end: Date) => invokeIPC('eventi:getByDateRange', start, end),
    create: (evento: any) => invokeIPC('eventi:create', evento),
    update: (id: number, evento: any) => invokeIPC('eventi:update', id, evento),
    delete: (id: number) => invokeIPC('eventi:delete', id),
    validate: (evento: any) => invokeIPC('eventi:validate', evento),
    getByCliente: (clienteId: number) => invokeIPC('eventi:getByCliente', clienteId),
    getByCollezione: (collezioneId: number) => invokeIPC('eventi:getByCollezione', collezioneId)
  }
} as ElectronAPI);

// Dichiarazione dei tipi per TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
