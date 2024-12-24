// src/types/database.ts

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
