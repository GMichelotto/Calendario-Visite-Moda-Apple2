import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type {
  APIResponse,
  Cliente,
  Collezione,
  Evento,
  CustomEvent,
  ValidationResponse,
  EventValidationRequest,
  SlotAvailability,
  ImportResult,
  ClientiOperations,
  CollezioniOperations,
  EventiOperations,
  ElectronAPI
} from './types';

const validChannels = [
  'clienti:getAll',
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

async function invokeIPC<T>(channel: string, ...args: any[]): Promise<T> {
  if (!isValidChannel(channel)) {
    throw new Error(`Canale IPC non autorizzato: ${channel}`);
  }
  return ipcRenderer.invoke(channel, ...args);
}

const clientiAPI: ClientiOperations = {
  getAll: () => invokeIPC<APIResponse<Cliente[]>>('clienti:getAll'),
  getById: (id) => invokeIPC<APIResponse<Cliente>>('clienti:getById', id),
  create: (data) => invokeIPC<APIResponse<Cliente>>('clienti:create', data),
  update: (id, data) => invokeIPC<APIResponse<Cliente>>('clienti:update', id, data),
  delete: (id) => invokeIPC<APIResponse<void>>('clienti:delete', id),
  assignCollezione: (clienteId, collezioneId) => invokeIPC<APIResponse<void>>('clienti:assignCollezione', clienteId, collezioneId),
  removeCollezione: (clienteId, collezioneId) => invokeIPC<APIResponse<void>>('clienti:removeCollezione', clienteId, collezioneId),
  importCSV: (content) => invokeIPC<APIResponse<ImportResult>>('clienti:importCSV', content)
};

contextBridge.exposeInMainWorld('electronAPI', {
  clienti: clientiAPI,
});
