/* eslint-disable @typescript-eslint/no-empty-function */

import type { Logger} from './logger';
import { LogLevel } from './logger';

export class DefaultLogger implements Logger {
  
  private readonly logLevel : LogLevel;

  constructor(logLevel: LogLevel = LogLevel.WARN){
    this.logLevel = logLevel;
  }

  error(...args: unknown[]): void {
    if(this.logLevel >=  LogLevel.ERROR) {
      console.error(...args);
    }
  }

  warn(...args: unknown[]): void {
    if(this.logLevel >=  LogLevel.WARN) {
      console.warn(...args);
    }
  }

  info(...args: unknown[]): void {
    if(this.logLevel >=  LogLevel.INFO) {
      console.info(...args);
    }
  }
  
  debug(...args: unknown[]): void {
    if(this.logLevel === LogLevel.DEBUG) {
      console.debug(...args);
    }
  }
}
