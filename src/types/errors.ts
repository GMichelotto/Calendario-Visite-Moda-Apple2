// src/types/errors.ts
export enum ErrorCode {
  DB_CONNECTION = 'DB_CONNECTION',
  DB_QUERY = 'DB_QUERY',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  BUSINESS_RULE = 'BUSINESS_RULE',
  IPC_ERROR = 'IPC_ERROR'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// src/utils/errorHandler.ts
import log from 'electron-log';

export function handleError(error: unknown, context: string): AppError {
  log.error(`Error in ${context}:`, error);

  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      ErrorCode.DB_QUERY,
      error.message,
      { originalError: error }
    );
  }

  return new AppError(
    ErrorCode.DB_QUERY,
    'An unknown error occurred',
    { originalError: error }
  );
}

// Esempio di utilizzo nel DatabaseService
class DatabaseService {
  async getClienti() {
    try {
      const stmt = this.db.prepare(`
        SELECT 
          c.*,
          GROUP_CONCAT(cc.collezione_id) as collezioni_ids
        FROM Clienti c
        LEFT JOIN ClientiCollezioni cc ON c.id = cc.cliente_id
        GROUP BY c.id
      `);
      return stmt.all();
    } catch (error) {
      throw handleError(error, 'DatabaseService.getClienti');
    }
  }
}

// src/preload/ipc.ts
import { ipcRenderer } from 'electron';
import { handleError } from '../utils/errorHandler';

export function createIPCHandler() {
  return {
    invoke: async (channel: string, ...args: any[]) => {
      try {
        return await ipcRenderer.invoke(channel, ...args);
      } catch (error) {
        throw handleError(error, `IPC.${channel}`);
      }
    }
  };
}
