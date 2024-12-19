// src/types/clientTypes.ts
import { Cliente } from './database';

export type CreateClienteFn = (clienteData: Omit<Cliente, 'id'>) => Promise<Cliente | null>;
export type UpdateClienteFn = (id: number, clienteData: Partial<Cliente>) => Promise<boolean>;
export type DeleteClienteFn = (id: number) => Promise<boolean>;
export type GetClienteFn = () => Promise<Cliente[]>;

export interface UseClientiReturn {
  clienti: Cliente[];
  isLoading: boolean;
  error: string | null;
  createCliente: CreateClienteFn;
  updateCliente: UpdateClienteFn;
  deleteCliente: DeleteClienteFn;
  refreshClienti: () => Promise<void>;
}
