import type { Logger } from './logger';

// list of substrings that indicate a value is sensitive and should be redacted
const SENSITIVE_KEY_HINTS = ['password', 'token', 'secret', 'apikey', 'api_key', 'authorization'];

// any string that looks like a JWT, bearer token, or long hex/base64 blob
const SECRET_LIKE_PATTERN = /^([A-Za-z0-9+/=_-]+)+$/;

export class LogRedactor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redactAndLog(level: keyof Logger, args: any[]): void {
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'string') {
        args[i] = this.redactString(args[i]);
      } else if (typeof args[i] === 'object' && args[i] !== null) {
        args[i] = this.redactObject(args[i]);
      }
    }
    this.logger[level](...args);
  }

  private redactString(input: string): string {
    if (input.length > 20 && SECRET_LIKE_PATTERN.test(input)) {
      // show first 4 chars so operators can correlate, redact the rest
      return input.slice(0, 5) + '***';
    }
    return input;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redactObject(obj: any): any {
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      for (const hint of SENSITIVE_KEY_HINTS) {
        if (lowerKey.indexOf(hint) >= 0) {
          obj[key] = '***';
          break;
        }
      }
    }
    return obj;
  }
}
