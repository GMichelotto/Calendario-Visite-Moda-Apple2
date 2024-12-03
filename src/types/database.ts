// src/types/database.ts

export interface Cliente {
  id: number;
  ragione_sociale: string;
  collezioni_ids?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  regione?: string;
  telefono?: string;
  cellulare?: string;
  email?: string;
  sito_web?: string;
}

export interface Collezione {
  id: number;
  nome: string;
  colore: string;
  data_apertura: string;
  data_chiusura: string;
  clienti_count?: number;
  eventi_count?: number;
}

export interface Evento {
  id: number;
  cliente_id: number;
  collezione_id: number;
  data_inizio: string;
  data_fine: string;
  note?: string;
  cliente_nome?: string;
  collezione_nome?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    errors?: string[];
  };
  error?: string;
}
