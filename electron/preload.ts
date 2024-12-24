import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type {
  ValidationResponse,
  EventValidationRequest,
  CustomEvent,
  Cliente,
  Collezione,
  Evento,
  ElectronAPI,
  APIResponse,
  SlotAvailability
} from './types';

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

function isValidChannel(channel: string): channel is ValidChannel {
  return validChannels.includes(channel as ValidChannel);
}

async function invokeIPC(channel: string, ...args: any[]): Promise<any> {
  if (isValidChannel(channel)) {
    return await ipcRenderer.invoke(channel, ...args);
  }
  throw new Error(`Canale IPC non autorizzato: ${channel}`);
}

const clientiAPI: ElectronAPI['clienti'] = {
  getAll: () => invokeIPC('clienti:getAll'),
  getById: (id: number) => invokeIPC('clienti:getById', id),
  create: (cliente: Omit<Cliente, 'id'>) => invokeIPC('clienti:create', cliente),
  update: (id: number, cliente: Partial<Cliente>) => invokeIPC('clienti:update', id, cliente),
  delete: (id: number) => invokeIPC('clienti:delete', id),
  assignCollezione: (clienteId: number, collezioneId: number) => invokeIPC('clienti:assignCollezione', clienteId, collezioneId),
  removeCollezione: (clienteId: number, collezioneId: number) => invokeIPC('clienti:removeCollezione', clienteId, collezioneId),
  importCSV: (content: string) => invokeIPC('clienti:importCSV', content)
};

const collezioniAPI: ElectronAPI['collezioni'] = {
  getAll: () => invokeIPC('collezioni:getAll'),
  getAllWithStats: () => invokeIPC('collezioni:getAllWithStats'),
  getById: (id: number) => invokeIPC('collezioni:getById', id),
  create: (collezione: Omit<Collezione, 'id'>) => invokeIPC('collezioni:create', collezione),
  update: (id: number, collezione: Partial<Collezione>) => invokeIPC('collezioni:update', id, collezione),
  delete: (id: number) => invokeIPC('collezioni:delete', id),
  checkAvailability: (id: number, start: Date, end: Date) =>
    invokeIPC('collezioni:checkAvailability', id, start, end) as Promise<SlotAvailability[]>,
  getClienti: (id: number) => invokeIPC('collezioni:getClienti', id),
  importCSV: (content: string) => invokeIPC('collezioni:importCSV', content)
};

const eventiAPI: ElectronAPI['eventi'] = {
  getAll: () => invokeIPC('eventi:getAll'),
  getByDateRange: (start: Date, end: Date) => invokeIPC('eventi:getByDateRange', start, end),
  create: (evento: Omit<Evento, 'id'>) => invokeIPC('eventi:create', evento),
  update: (id: number, evento: Partial<Evento>) => invokeIPC('eventi:update', id, evento),
  delete: (id: number) => invokeIPC('eventi:delete', id),
  validate: (evento: EventValidationRequest) => invokeIPC('eventi:validate', evento),
  getByCliente: (clienteId: number) => invokeIPC('eventi:getByCliente', clienteId),
  getByCollezione: (collezioneId: number) => invokeIPC('eventi:getByCollezione', collezioneId)
};

contextBridge.exposeInMainWorld('electronAPI', {
  clienti: clientiAPI,
  collezioni: collezioniAPI,
  eventi: eventiAPI
} as ElectronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
