// src/utils/logger.ts
import log from 'electron-log';
import path from 'path';
import { app } from 'electron';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogContext {
  component: string;
  action: string;
  user?: string;
  [key: string]: any;
}

class Logger {
  constructor() {
    this.initializeLogger();
  }

  private initializeLogger() {
    log.transports.file.resolvePathFn = () => path.join(
      app.getPath('userData'),
      'logs/fashion-calendar.log'
    );

    log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s} [{level}] {text}';
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
    log.transports.file.level = 'debug';
    
    // In development, show all console logs
    if (process.env.NODE_ENV === 'development') {
      log.transports.console.level = 'debug';
    } else {
      log.transports.console.level = 'warn';
    }
  }

  logWithContext(level: LogLevel, message: string, context: LogContext) {
    const logMessage = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    };

    switch (level) {
      case LogLevel.ERROR:
        log.error(JSON.stringify(logMessage));
        break;
      case LogLevel.WARN:
        log.warn(JSON.stringify(logMessage));
        break;
      case LogLevel.INFO:
        log.info(JSON.stringify(logMessage));
        break;
      case LogLevel.DEBUG:
        log.debug(JSON.stringify(logMessage));
        break;
    }
  }

  error(message: string, context: LogContext) {
    this.logWithContext(LogLevel.ERROR, message, context);
  }

  warn(message: string, context: LogContext) {
    this.logWithContext(LogLevel.WARN, message, context);
  }

  info(message: string, context: LogContext) {
    this.logWithContext(LogLevel.INFO, message, context);
  }

  debug(message: string, context: LogContext) {
    this.logWithContext(LogLevel.DEBUG, message, context);
  }

  // Utility method for logging database operations
  logDBOperation(operation: string, details: any) {
    this.info(`Database operation: ${operation}`, {
      component: 'Database',
      action: operation,
      details
    });
  }

  // Utility method for logging IPC communications
  logIPC(channel: string, args: any[], direction: 'send' | 'receive') {
    this.debug(`IPC ${direction}: ${channel}`, {
      component: 'IPC',
      action: channel,
      direction,
      args
    });
  }
}

export default new Logger();
