import { AppError, ErrorCode } from '../types/errors';
import Logger from '../utils/logger';
import { BaseEntity, IBaseService, ServiceResponse } from '../types/base';

export abstract class BaseService<T extends BaseEntity> implements IBaseService<T> {
  protected abstract entityName: string;
  protected abstract tableName: string;
  protected ipcRenderer: typeof window.electron.ipcRenderer;
  protected logger: typeof Logger;

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
    this.logger = Logger;
  }

  protected logAction(action: string, details?: any) {
    return {
      component: this.entityName + 'Service',
      action,
      ...details
    };
  }

  async getAll(): Promise<T[]> {
    try {
      this.logger.info(`Fetching all ${this.entityName.toLowerCase()}s`, 
        this.logAction('getAll')
      );

      const items = await this.ipcRenderer.invoke(`${this.tableName}:getAll`);
      
      this.logger.debug(`${this.entityName}s fetched successfully`, 
        this.logAction('getAll', { count: items.length })
      );

      return items;
    } catch (error) {
      this.logger.error(`Failed to fetch ${this.entityName.toLowerCase()}s`, 
        this.logAction('getAll', { error })
      );
      
      throw new AppError(
        ErrorCode.DB_QUERY,
        `Errore nel recupero dei ${this.entityName.toLowerCase()}`,
        { originalError: error }
      );
    }
  }

  // Implementare gli altri metodi base qui...
}
