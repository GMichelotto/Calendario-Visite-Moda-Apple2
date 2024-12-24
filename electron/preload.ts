// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type {
  ValidationResponse,
  EventValidationRequest,
  CustomEvent
} from '../src/types/database';

// Interfaces
interface ValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duration?: number;
  checks: {
    timeConstraints: boolean;
    overlap: boolean;
    clientAvailability: boolean;
    collectionPeriod: boolean;
    duration: boolean;
  };
}

interface ClienteResponse {
  id: number;
  ragione_sociale: string;
  appointments_count?: number;
  total_duration?: number;
  [key: string]: any;
}

interface CollezioneResponse {
  id: number;
  nome: string;
  colore: string;
  data_inizio: string;
  data_fine: string;
  [key: string]: any;
}

interface EventoResponse {
  id: number;
  cliente_id: number;
  collezione_id: number;
  data_inizio: string;
  data_fine: string;
  note?: string;
  [key: string]: any;
}

// Definizione delle operazioni per ciascuna entità
interface ClientiOperations {
  getAll: () => Promise<ClienteResponse[]>;
  getAllWithCollezioni: () => Promise<ClienteResponse[]>;
  getById: (id: number) => Promise<ClienteResponse>;
  create: (cliente: Omit<ClienteResponse, 'id'>) => Promise<ClienteResponse>;
  update: (id: number, cliente: Partial<ClienteResponse>) => Promise<boolean>;
  delete: (id: number) => Promise<boolean>;
  assignCollezione: (clienteId: number, collezioneId: number) => Promise<boolean>;
  removeCollezione: (clienteId: number, collezioneId: number) => Promise<boolean>;
  importCSV: (content: string) => Promise<{ success: boolean; errors: string[] }>;
}

interface CollezioniOperations {
  getAll: () => Promise<CollezioneResponse[]>;
  getAllWithStats: () => Promise<CollezioneResponse[]>;
  getById: (id: number) => Promise<CollezioneResponse>;
  create: (collezione: Omit<CollezioneResponse, 'id'>) => Promise<CollezioneResponse>;
  update: (id: number, collezione: Partial<CollezioneResponse>) => Promise<boolean>;
  delete: (id: number) => Promise<boolean>;
  getClienti: (id: number) => Promise<ClienteResponse[]>;
  checkAvailability: (id: number, start: Date, end: Date) => Promise<{
    slot_start: string;
    status: string;
  }[]>;
  importCSV: (content: string) => Promise<{ success: boolean; errors: string[] }>;
}

interface EventiOperations {
  getAll: () => Promise<EventoResponse[]>;
  getByDateRange: (start: Date, end: Date) => Promise<EventoResponse[]>;
  create: (evento: Omit<EventoResponse, 'id'>) => Promise<EventoResponse>;
  update: (id: number, evento: Partial<EventoResponse>) => Promise<boolean>;
  delete: (id: number) => Promise<boolean>;
  validate: (evento: EventValidationRequest) => Promise<ValidationResponse>;
  getByCliente: (clienteId: number) => Promise<EventoResponse[]>;
  getByCollezione: (collezioneId: number) => Promise<EventoResponse[]>;
}

// Definizione dei canali IPC permessi
const validChannels = [
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
  'eventi:getByCollezione'
] as const;

type ValidChannel = typeof validChannels[number];

// Interface globale per l'API electron
interface ElectronAPI {
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
