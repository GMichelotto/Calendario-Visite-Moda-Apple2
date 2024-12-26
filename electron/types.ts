// electron/types.ts

// Base API Types
export interface APIResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Entity Types
export interface Cliente {
  id: number;
  ragione_sociale: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  appointments_count?: number;
  total_duration?: number;
}

export interface Collezione {
  id: number;
  nome: string;
  colore: string;
  data_inizio: string;
  data_fine: string;
  note?: string;
}

export interface Evento {
  id: number;
  cliente_id: number;
  collezione_id: number;
  data_inizio: string;
  data_fine: string;
  note?: string;
}

// Validation Types
export interface ValidationResponse {
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

export interface EventValidationRequest {
  cliente_id: string;
  collezione_id: string;
  data_inizio: string;
  data_fine: string;
  id?: number;
}

// Calendar Event Types
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

export interface SlotAvailability {
  slot_start: string;
  status: string;
}

// API Operations Interfaces
export interface ClientiOperations {
  getAll: () => Promise<APIResponse<Cliente[]>>;
  getById: (id: number) => Promise<APIResponse<Cliente>>;
  create: (data: Omit<Cliente, "id">) => Promise<APIResponse<Cliente>>;
  update: (id: number, data: Partial<Cliente>) => Promise<APIResponse<Cliente>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  assignCollezione: (clienteId: number, collezioneId: number) => Promise<APIResponse<void>>;
  removeCollezione: (clienteId: number, collezioneId: number) => Promise<APIResponse<void>>;
  importCSV: (content: string) => Promise<APIResponse<{ success: boolean; errors: string[] }>>;
}

export interface CollezioniOperations {
  getAll: () => Promise<APIResponse<Collezione[]>>;
  getAllWithStats: () => Promise<APIResponse<Collezione[]>>;
  getById: (id: number) => Promise<APIResponse<Collezione>>;
  create: (data: Omit<Collezione, "id">) => Promise<APIResponse<Collezione>>;
  update: (id: number, data: Partial<Collezione>) => Promise<APIResponse<Collezione>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  checkAvailability: (id: number, start: Date, end: Date) => Promise<SlotAvailability[]>;
  getClienti: (id: number) => Promise<APIResponse<Cliente[]>>;
  importCSV: (content: string) => Promise<APIResponse<{ success: boolean; errors: string[] }>>;
}

export interface EventiOperations {
  getAll: () => Promise<APIResponse<Evento[]>>;
  getByDateRange: (start: Date, end: Date) => Promise<APIResponse<Evento[]>>;
  create: (data: Omit<Evento, "id">) => Promise<APIResponse<Evento>>;
  update: (id: number, data: Partial<Evento>) => Promise<APIResponse<Evento>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  validate: (evento: EventValidationRequest) => Promise<ValidationResponse>;
  getByCliente: (clienteId: number) => Promise<APIResponse<Evento[]>>;
  getByCollezione: (collezioneId: number) => Promise<APIResponse<Evento[]>>;
}

// Main ElectronAPI Interface
export interface ElectronAPI {
  clienti: ClientiOperations;
  collezioni: CollezioniOperations;
  eventi: EventiOperations;
}
