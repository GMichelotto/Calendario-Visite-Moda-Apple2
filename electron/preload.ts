import { contextBridge, ipcRenderer } from 'electron';
import { 
  ElectronAPI, 
  APIResponse, 
  Cliente, 
  Collezione, 
  Evento, 
  ValidationResponse, 
  ImportResult, 
  SlotAvailability,
  ExportResult
} from './types';

async function invokeIPC<T>(channel: string, ...args: any[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args);
}

const api: ElectronAPI = {
  database: {
    operation: (operation: string, ...args: any[]) => 
      invokeIPC<any>('database:operation', operation, ...args),
    initialize: () => invokeIPC<void>('database:initialize'),
    backup: (path: string) => invokeIPC<void>('database:backup', path),
    restore: (path: string) => invokeIPC<void>('database:restore', path)
  },

  clienti: {
    getAll: () => invokeIPC<APIResponse<Cliente[]>>('clienti:getAll'),
    getAllWithCollezioni: () => invokeIPC<APIResponse<Cliente[]>>('clienti:getAllWithCollezioni'),
    getById: (id: number) => invokeIPC<APIResponse<Cliente>>('clienti:getById', id),
    create: (data) => invokeIPC<APIResponse<Cliente>>('clienti:create', data),
    update: (id, data) => invokeIPC<APIResponse<Cliente>>('clienti:update', id, data),
    delete: (id) => invokeIPC<APIResponse<void>>('clienti:delete', id),
    assignCollezione: (clienteId, collezioneId) => 
      invokeIPC<APIResponse<void>>('clienti:assignCollezione', clienteId, collezioneId),
    removeCollezione: (clienteId, collezioneId) => 
      invokeIPC<APIResponse<void>>('clienti:removeCollezione', clienteId, collezioneId),
    importCSV: (content) => 
      invokeIPC<APIResponse<ImportResult>>('clienti:importCSV', content),
    exportCSV: () => invokeIPC<APIResponse<ExportResult>>('clienti:exportCSV')
  },

  collezioni: {
    getAll: () => invokeIPC<APIResponse<Collezione[]>>('collezioni:getAll'),
    getAllWithStats: () => invokeIPC<APIResponse<Collezione[]>>('collezioni:getAllWithStats'),
    getById: (id) => invokeIPC<APIResponse<Collezione>>('collezioni:getById', id),
    create: (data) => invokeIPC<APIResponse<Collezione>>('collezioni:create', data),
    update: (id, data) => invokeIPC<APIResponse<Collezione>>('collezioni:update', id, data),
    delete: (id) => invokeIPC<APIResponse<void>>('collezioni:delete', id),
    checkAvailability: (id, start, end) => 
      invokeIPC<APIResponse<SlotAvailability[]>>('collezioni:checkAvailability', id, start, end),
    getClienti: (id) => invokeIPC<APIResponse<Cliente[]>>('collezioni:getClienti', id),
    importCSV: (content) => 
      invokeIPC<APIResponse<ImportResult>>('collezioni:importCSV', content),
    exportCSV: () => invokeIPC<APIResponse<ExportResult>>('collezioni:exportCSV'),
    getDashboardStats: (id) => 
      invokeIPC<APIResponse<{
        totalClienti: number;
        totaleAppuntamenti: number;
        disponibilita: number;
        slotDisponibili: number;
      }>>('collezioni:getDashboardStats', id)
  },

  eventi: {
    getAll: () => invokeIPC<APIResponse<Evento[]>>('eventi:getAll'),
    getById: (id) => invokeIPC<APIResponse<Evento>>('eventi:getById', id),
    getByDateRange: (start, end) => 
      invokeIPC<APIResponse<Evento[]>>('eventi:getByDateRange', start, end),
    getByCliente: (clienteId) => 
      invokeIPC<APIResponse<Evento[]>>('eventi:getByCliente', clienteId),
    getByCollezione: (collezioneId) => 
      invokeIPC<APIResponse<Evento[]>>('eventi:getByCollezione', collezioneId),
    create: (data) => invokeIPC<APIResponse<Evento>>('eventi:create', data),
    update: (id, data) => invokeIPC<APIResponse<Evento>>('eventi:update', id, data),
    delete: (id) => invokeIPC<APIResponse<void>>('eventi:delete', id),
    validate: (evento) => invokeIPC<ValidationResponse>('eventi:validate', evento),
    validateBulk: (eventi) => 
      invokeIPC<{ [key: string]: ValidationResponse }>('eventi:validateBulk', eventi),
    exportToCalendar: (start, end) => 
      invokeIPC<APIResponse<ExportResult>>('eventi:exportToCalendar', start, end),
    importFromCalendar: (content) => 
      invokeIPC<APIResponse<ImportResult>>('eventi:importFromCalendar', content)
  }
};

// Espone l'API al processo di rendering
contextBridge.exposeInMainWorld('electronAPI', api);
contextBridge.exposeInMainWorld('isDev', process.env.NODE_ENV === 'development');
