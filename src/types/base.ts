// src/types/base.ts

export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  errors: string[];
  imported: number;
  failed: number;
}

export interface DatabaseConfig {
  filename: string;
  verbose?: boolean;
  timeout?: number;
  migrations?: boolean;
}

// Common service interface that all services should implement
export interface IBaseService<T extends BaseEntity> {
  getAll(): Promise<T[]>;
  getById(id: number): Promise<T>;
  create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<number>;
  update(id: number, entity: Partial<T>): Promise<boolean>;
  delete(id: number): Promise<boolean>;
  importFromCSV?(csvContent: string): Promise<ImportResult>;
}
