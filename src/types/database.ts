import type { 
  APIResponse,
  Cliente,
  Collezione,
  Evento,
  ValidationResponse,
  EventValidationRequest,
  CustomEvent,
  EventFormData,
  SlotAvailability,
  ImportResult,
  ClientiOperations,
  CollezioniOperations,
  EventiOperations,
  ElectronAPI
} from '../../electron/types';

export type {
  APIResponse,
  Cliente,
  Collezione,
  Evento,
  ValidationResponse,
  EventValidationRequest,
  CustomEvent,
  EventFormData,
  SlotAvailability,
  ImportResult,
  ClientiOperations,
  CollezioniOperations,
  EventiOperations,
  ElectronAPI
};

export interface UseClienteResult {
  cliente: Cliente | null;
  isLoading: boolean;
  error: string | null;
  update: (data: Partial<Cliente>) => Promise<APIResponse<Cliente>>;
  delete: () => Promise<APIResponse<void>>;
}

export interface UseClientiResult {
  clienti: Cliente[];
  isLoading: boolean;
  error: string | null;
  create: (data: Omit<Cliente, 'id'>) => Promise<APIResponse<Cliente>>;
  update: (id: number, data: Partial<Cliente>) => Promise<APIResponse<Cliente>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  refresh: () => Promise<void>;
}

export interface UseCollezioneResult {
  collezione: Collezione | null;
  isLoading: boolean;
  error: string | null;
  update: (data: Partial<Collezione>) => Promise<APIResponse<Collezione>>;
  delete: () => Promise<APIResponse<void>>;
}

export interface UseCollezioniResult {
  collezioni: Collezione[];
  isLoading: boolean;
  error: string | null;
  create: (data: Omit<Collezione, 'id'>) => Promise<APIResponse<Collezione>>;
  update: (id: number, data: Partial<Collezione>) => Promise<APIResponse<Collezione>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  refresh: () => Promise<void>;
}

export interface UseEventoResult {
  evento: Evento | null;
  isLoading: boolean;
  error: string | null;
  update: (data: Partial<Evento>) => Promise<APIResponse<Evento>>;
  delete: () => Promise<APIResponse<void>>;
  validate: (data: EventValidationRequest) => Promise<ValidationResponse>;
}

export interface UseEventiResult {
  eventi: Evento[];
  isLoading: boolean;
  error: string | null;
  create: (data: Omit<Evento, 'id'>) => Promise<APIResponse<Evento>>;
  update: (id: number, data: Partial<Evento>) => Promise<APIResponse<Evento>>;
  delete: (id: number) => Promise<APIResponse<void>>;
  refresh: () => Promise<void>;
  validate: (data: EventValidationRequest) => Promise<ValidationResponse>;
  getByDateRange: (start: Date, end: Date) => Promise<APIResponse<Evento[]>>;
}
