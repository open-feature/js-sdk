/* eslint-disable @typescript-eslint/no-empty-function */

import type { Logger } from './logger';

export class DefaultLogger implements Logger {
  
  private readonly showInfo : boolean = false;
  private readonly showDebug : boolean = false;

  constructor(showInfo: boolean = false, showDebug: boolean = false){
    this.showInfo = showInfo;
    this.showDebug = showDebug;
  }

  error(...args: unknown[]): void {
    console.error(...args);
  }

  warn(...args: unknown[]): void {
    console.warn(...args);
  }

  info(...args: unknown[]): void {
    if(this.showInfo) {
      console.info(...args);
    }
  }
  
  debug(...args: unknown[]): void {
    if(this.showDebug) {
      console.debug(...args);
    }
  }
}
