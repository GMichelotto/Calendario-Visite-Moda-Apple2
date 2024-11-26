export interface Cliente {
  id: number;
  ragione_sociale: string;
  citta: string;
  provincia: string;
  collezioni?: string[];
  email?: string;
  telefono?: string;
  indirizzo?: string;
  cap?: string;
  note?: string;
  status?: 'active' | 'inactive';
}
