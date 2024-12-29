// electron/preload.ts

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
  ExportResult,
  DashboardStats,
  EventValidationRequest
} from '../shared/types';

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
    create: (data: Omit<Cliente, 'id'>) => invokeIPC<APIResponse<Cliente>>('clienti:create', data),
    update: (id: number, data: Partial<Cliente>) => 
      invokeIPC<APIResponse<Cliente>>('clienti:update', id, data),
    delete: (id: number) => invokeIPC<APIResponse<void>>('clienti:delete', id),
    assignCollezione: (clienteId: number, collezioneId: number) => 
      invokeIPC<APIResponse<void>>('clienti:assignCollezione', clienteId, collezioneId),
    removeCollezione: (clienteId: number, collezioneId: number) => 
      invokeIPC<APIResponse<void>>('clienti:removeCollezione', clienteId, collezioneId),
    importCSV: (content: string) => 
      invokeIPC<APIResponse<ImportResult>>('clienti:importCSV', content),
    exportCSV: () => invokeIPC<APIResponse<ExportResult>>('clienti:exportCSV')
  },

  collezioni: {
    getAll: () => invokeIPC<APIResponse<Collezione[]>>('collezioni:getAll'),
    getAllWithStats: () => invokeIPC<APIResponse<Collezione[]>>('collezioni:getAllWithStats'),
    getById: (id: number) => invokeIPC<APIResponse<Collezione>>('collezioni:getById', id),
    create: (data: Omit<Collezione, 'id'>) => 
      invokeIPC<APIResponse<Collezione>>('collezioni:create', data),
    update: (id: number, data: Partial<Collezione>) => 
      invokeIPC<APIResponse<Collezione>>('collezioni:update', id, data),
    delete: (id: number) => invokeIPC<APIResponse<void>>('collezioni:delete', id),
    checkAvailability: (id: number, start: Date, end: Date) => 
      invokeIPC<APIResponse<SlotAvailability[]>>('collezioni:checkAvailability', id, start, end),
    getClienti: (id: number) => invokeIPC<APIResponse<Cliente[]>>('collezioni:getClienti', id),
    importCSV: (content: string) => 
      invokeIPC<APIResponse<ImportResult>>('collezioni:importCSV', content),
    exportCSV: () => invokeIPC<APIResponse<ExportResult>>('collezioni:exportCSV'),
    getDashboardStats: (id: number) => 
      invokeIPC<APIResponse<DashboardStats>>('collezioni:getDashboardStats', id)
  },

  eventi: {
    getAll: () => invokeIPC<APIResponse<Evento[]>>('eventi:getAll'),
    getById: (id: number) => invokeIPC<APIResponse<Evento>>('eventi:getById', id),
    getByDateRange: (start: Date, end: Date) => 
      invokeIPC<APIResponse<Evento[]>>('eventi:getByDateRange', start, end),
    getByCliente: (clienteId: number) => 
      invokeIPC<APIResponse<Evento[]>>('eventi:getByCliente', clienteId),
    getByCollezione: (collezioneId: number) => 
      invokeIPC<APIResponse<Evento[]>>('eventi:getByCollezione', collezioneId),
    create: (data: Omit<Evento, 'id'>) => 
      invokeIPC<APIResponse<Evento>>('eventi:create', data),
    update: (id: number, data: Partial<Evento>) => 
      invokeIPC<APIResponse<Evento>>('eventi:update', id, data),
    delete: (id: number) => invokeIPC<APIResponse<void>>('eventi:delete', id),
    validate: (evento: EventValidationRequest) => 
      invokeIPC<ValidationResponse>('eventi:validate', evento),
    validateBulk: (eventi: EventValidationRequest[]) => 
      invokeIPC<{ [key: string]: ValidationResponse }>('eventi:validateBulk', eventi),
    exportToCalendar: (start: Date, end: Date) => 
      invokeIPC<APIResponse<ExportResult>>('eventi:exportToCalendar', start, end),
    importFromCalendar: (content: string) => 
      invokeIPC<APIResponse<ImportResult>>('eventi:importFromCalendar', content)
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
contextBridge.exposeInMainWorld('isDev', process.env.NODE_ENV === 'development');
