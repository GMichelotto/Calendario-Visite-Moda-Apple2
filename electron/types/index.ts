import type { ValidationResponse } from '@shared/types';

export type { ValidationResponse };

// Interfacce base
export interface Cliente {
  id?: number;
  ragione_sociale: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  regione?: string;
  telefono?: string;
  cellulare?: string;
  email?: string;
  sito_web?: string;
  note?: string;
  collezioni?: string[];
  appointments_count?: number;
  total_duration?: number;
}

export interface Collezione {
  id?: number;
  nome: string;
  data_inizio: string;
  data_fine: string;
  colore: string;
  note?: string;
}

export interface Evento {
  id?: number;
  cliente_id: number;
  collezione_id: number;
  data_inizio: string;
  data_fine: string;
  note?: string;
  cliente_nome?: string;
  collezione_nome?: string;
  collezione_colore?: string;
}

// Interfacce di risposta e richiesta
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface ImportResult {
  rowsImported: number;
  errors?: string[];
}

export interface EventValidationRequest {
  cliente_id: string;
  collezione_id: string;
  data_inizio: string;
  data_fine: string;
  note?: string;
  id?: number;
}

export interface CollezioneResponse {
  id: number;
  nome: string;
  colore: string;
  data_inizio: string;
  data_fine: string;
}

export interface CustomEvent {
  id: number;
  cliente_id: string;
  collezione_id: string;
  start: Date;
  end: Date;
  note?: string;
}

export interface EventFormData {
  cliente_id: string;
  collezione_id: string;
  data_inizio: string;
  data_fine: string;
  note: string;
}

// Interfacce di utilità
export interface SlotAvailability {
  start: Date;
  end: Date;
  isAvailable: boolean;
  conflicts?: {
    clienteId: number;
    clienteName: string;
    collezioneId: number;
    collezioneName: string;
  }[];
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export interface DashboardStats {
  totalClienti: number;
  totaleAppuntamenti: number;
  disponibilita: number;
  slotDisponibili: number;
}

// Interfacce delle operazioni
export interface DatabaseOperations {
  operation: (operation: string, ...args: any[]) => Promise<any>;
  initialize: () => Promise<void>;
  backup: (path: string) => Promise<void>;
  restore: (path: string) => Promise<void>;
}

export interface ClientiOperations {
  getAll: () => Promise<APIResponse<Cliente[]>>;
  getAllWithCollezioni: () => Promise<APIResponse<Cliente[]>>;
  getById: (id: number) => Promise<APIResponse<Cliente>>;
  create: (data: Omit<Cliente, 'id'>) => Promise<APIResponse<Cliente>>;
  update: (id: number, data: Partial<Cliente>) => Promise<APIResponse<Cliente>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  assignCollezione: (clienteId: number, collezioneId: number) => Promise<APIResponse<void>>;
  removeCollezione: (clienteId: number, collezioneId: number) => Promise<APIResponse<void>>;
  importCSV: (content: string) => Promise<APIResponse<ImportResult>>;
  exportCSV: () => Promise<APIResponse<ExportResult>>;
}

export interface CollezioniOperations {
  getAll: () => Promise<APIResponse<Collezione[]>>;
  getAllWithStats: () => Promise<APIResponse<Collezione[]>>;
  getById: (id: number) => Promise<APIResponse<Collezione>>;
  create: (data: Omit<Collezione, 'id'>) => Promise<APIResponse<Collezione>>;
  update: (id: number, data: Partial<Collezione>) => Promise<APIResponse<Collezione>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  checkAvailability: (id: number, start: Date, end: Date) => Promise<APIResponse<SlotAvailability[]>>;
  getClienti: (id: number) => Promise<APIResponse<Cliente[]>>;
  importCSV: (content: string) => Promise<APIResponse<ImportResult>>;
  exportCSV: () => Promise<APIResponse<ExportResult>>;
  getDashboardStats: (id: number) => Promise<APIResponse<DashboardStats>>;
}

export interface EventiOperations {
  getAll: () => Promise<APIResponse<Evento[]>>;
  getById: (id: number) => Promise<APIResponse<Evento>>;
  getByDateRange: (start: Date, end: Date) => Promise<APIResponse<Evento[]>>;
  getByCliente: (clienteId: number) => Promise<APIResponse<Evento[]>>;
  getByCollezione: (collezioneId: number) => Promise<APIResponse<Evento[]>>;
  create: (data: Omit<Evento, 'id'>) => Promise<APIResponse<Evento>>;
  update: (id: number, data: Partial<Evento>) => Promise<APIResponse<Evento>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  validate: (evento: EventValidationRequest) => Promise<ValidationResponse>;
  validateBulk: (eventi: EventValidationRequest[]) => Promise<{ [key: string]: ValidationResponse }>;
  exportToCalendar: (start: Date, end: Date) => Promise<APIResponse<ExportResult>>;
  importFromCalendar: (content: string) => Promise<APIResponse<ImportResult>>;
}

// Interfaccia principale dell'API Electron
export interface ElectronAPI {
  database: DatabaseOperations;
  clienti: ClientiOperations;
  collezioni: CollezioniOperations;
  eventi: EventiOperations;
}

// Estensione del tipo Window
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    isDev: boolean;
  }
}
