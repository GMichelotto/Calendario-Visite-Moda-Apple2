import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type {
  ValidationResponse,
  EventValidationRequest,
  CustomEvent,
  ClienteResponse,
  CollezioneResponse,
  EventoResponse
} from './types';  // Import locale

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

// Operations interfaces
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
   getById: (id: number) => invokeIPC('clienti:getById', id), // Add this line
   create: (cliente: any) => invokeIPC('clienti:create', cliente),
   update: (id: number, cliente: any) => invokeIPC('clienti:update', id, cliente),
   delete: (id: number) => invokeIPC('clienti:delete', id),
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
    validate: (evento: EventValidationRequest) => invokeIPC('eventi:validate', evento),
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
