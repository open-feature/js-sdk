import type { Logger } from './logger';
import { DefaultLogger } from './default-logger';

export const LOG_LEVELS: Array<keyof Logger> = ['error', 'warn', 'info', 'debug'];

export class SafeLogger implements Logger {
  private readonly logger: Logger;
  private readonly fallbackLogger = new DefaultLogger();

  constructor(logger: Logger) {
    try {
      for (const level of LOG_LEVELS) {
        if (!logger[level] || typeof logger[level] !== 'function') {
          throw new Error(`The provided logger is missing the ${level} method.`);
        }
      }
      this.logger = logger;
    } catch (err) {
      console.error(err);
      console.error('Falling back to the default logger.');
      this.logger = this.fallbackLogger;
    }
  }

  error(...args: unknown[]): void {
    this.log('error', ...args);
  }

  warn(...args: unknown[]): void {
    this.log('warn', ...args);
  }

  info(...args: unknown[]): void {
    this.log('info', ...args);
  }

  debug(...args: unknown[]): void {
    this.log('debug', ...args);
  }

  private log(level: keyof Logger, ...args: unknown[]) {
    try {
      this.logger[level](...args);
    } catch (error) {
      this.fallbackLogger[level](...args);
    }
  }
}
