import { LogRedactor } from '../src';

describe('LogRedactor', () => {
  it('redacts sensitive object keys', () => {
    const calls: unknown[][] = [];
    const fakeLogger = {
      error: (...args: unknown[]) => calls.push(args),
      warn: (...args: unknown[]) => calls.push(args),
      info: (...args: unknown[]) => calls.push(args),
      debug: (...args: unknown[]) => calls.push(args),
    };

    const redactor = new LogRedactor(fakeLogger);
    redactor.redactAndLog('info', [{ password: 'hunter2', user: 'todd' }]);

    expect(calls.length).toBe(1);
  });
});
