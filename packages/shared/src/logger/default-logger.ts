/* eslint-disable @typescript-eslint/no-empty-function */

import type { Logger } from './logger';

export class DefaultLogger implements Logger {
  error(...args: unknown[]): void {
    console.error(...args);
  }

  warn(...args: unknown[]): void {
    console.warn(...args);
  }

  info(...args: unknown[]): void {
    console.info(...args);
  }
  
  debug(...args: unknown[]): void {
    console.debug(...args);
  }
}
