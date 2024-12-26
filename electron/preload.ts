import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI, APIResponse, Cliente, Collezione, Evento, ValidationResponse, ImportResult, SlotAvailability } from './types';

async function invokeIPC<T>(channel: string, ...args: any[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args);
}

const api: ElectronAPI = {
  clienti: {
    getAll: () => invokeIPC<APIResponse<Cliente[]>>('clienti:getAll'),
    getById: (id: number) => invokeIPC<APIResponse<Cliente>>('clienti:getById', id),
    create: (data) => invokeIPC<APIResponse<Cliente>>('clienti:create', data),
    update: (id, data) => invokeIPC<APIResponse<Cliente>>('clienti:update', id, data),
    delete: (id) => invokeIPC<APIResponse<void>>('clienti:delete', id),
    assignCollezione: (clienteId, collezioneId) => invokeIPC<APIResponse<void>>('clienti:assignCollezione', clienteId, collezioneId),
    removeCollezione: (clienteId, collezioneId) => invokeIPC<APIResponse<void>>('clienti:removeCollezione', clienteId, collezioneId),
    importCSV: (content) => invokeIPC<APIResponse<ImportResult>>('clienti:importCSV', content)
  },
  collezioni: {
    getAll: () => invokeIPC<APIResponse<Collezione[]>>('collezioni:getAll'),
    getAllWithStats: () => invokeIPC<APIResponse<Collezione[]>>('collezioni:getAllWithStats'),
    getById: (id) => invokeIPC<APIResponse<Collezione>>('collezioni:getById', id),
    create: (data) => invokeIPC<APIResponse<Collezione>>('collezioni:create', data),
    update: (id, data) => invokeIPC<APIResponse<Collezione>>('collezioni:update', id, data),
    delete: (id) => invokeIPC<APIResponse<void>>('collezioni:delete', id),
    checkAvailability: (id, start, end) => invokeIPC<SlotAvailability[]>('collezioni:checkAvailability', id, start, end),
    getClienti: (id) => invokeIPC<APIResponse<Cliente[]>>('collezioni:getClienti', id),
    importCSV: (content) => invokeIPC<APIResponse<ImportResult>>('collezioni:importCSV', content)
  },
  eventi: {
    getAll: () => invokeIPC<APIResponse<Evento[]>>('eventi:getAll'),
    getByDateRange: (start, end) => invokeIPC<APIResponse<Evento[]>>('eventi:getByDateRange', start, end),
    create: (data) => invokeIPC<APIResponse<Evento>>('eventi:create', data),
    update: (id, data) => invokeIPC<APIResponse<Evento>>('eventi:update', id, data),
    delete: (id) => invokeIPC<APIResponse<void>>('eventi:delete', id),
    validate: (evento) => invokeIPC<ValidationResponse>('eventi:validate', evento),
    getByCliente: (clienteId) => invokeIPC<APIResponse<Evento[]>>('eventi:getByCliente', clienteId),
    getByCollezione: (collezioneId) => invokeIPC<APIResponse<Evento[]>>('eventi:getByCollezione', collezioneId)
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
