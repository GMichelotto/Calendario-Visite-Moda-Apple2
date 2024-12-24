export interface Cliente {
  id: number;
  ragione_sociale: string;
  appointments_count?: number;
  total_duration?: number;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface ClientiOperations {
  getAll: () => Promise<APIResponse<Cliente[]>>;
  getById: (id: number) => Promise<APIResponse<Cliente>>;
  create: (data: Omit<Cliente, "id">) => Promise<APIResponse<Cliente>>;
  update: (id: number, data: Partial<Cliente>) => Promise<APIResponse<Cliente>>;
  delete: (id: number) => Promise<APIResponse<void>>;
}

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

export interface CollezioneResponse {
  id: number;
  nome: string;
  colore: string;
  data_inizio: string;
  data_fine: string;
}

export interface Collezione extends CollezioneResponse {
  note?: string;
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
