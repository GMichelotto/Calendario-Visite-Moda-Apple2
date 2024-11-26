export interface DatabaseOperation {
  operation: (operation: string, ...args: any[]) => Promise<any>;
}

export interface ElectronAPI {
  database: {
    operation: DatabaseOperation['operation'];
  };
}
