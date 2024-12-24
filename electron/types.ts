// electron/types.ts

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

export interface ClienteResponse {
    id: number;
    ragione_sociale: string;
    appointments_count?: number;
    total_duration?: number;
    [key: string]: any;
}

export interface CollezioneResponse {
    id: number;
    nome: string;
    colore: string;
    data_inizio: string;
    data_fine: string;
    [key: string]: any;
}

export interface EventoResponse {
    id: number;
    cliente_id: number;
    collezione_id: number;
    data_inizio: string;
    data_fine: string;
    note?: string;
    [key: string]: any;
}

export interface ClientiOperations {
 getAll: () => Promise<APIResponse<Cliente[]>>;
 getById: (id: number) => Promise<APIResponse<Cliente>>;
 create: (data: Omit<Cliente, "id">) => Promise<APIResponse<Cliente>>;
 update: (id: number, data: Partial<Cliente>) => Promise<APIResponse<Cliente>>;
 delete: (id: number) => Promise<APIResponse<void>>;
}
