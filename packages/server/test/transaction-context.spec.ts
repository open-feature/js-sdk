import {
  OpenFeature,
  AsyncLocalStorageTransactionContextPropagator,
  NOOP_TRANSACTION_CONTEXT_PROPAGATOR,
} from '../src';

describe('AsyncLocalStorageTransactionContextPropagator', () => {
  beforeAll(() => {
    OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContextPropagator());
  });

  afterAll(() => {
    OpenFeature.setTransactionContextPropagator(NOOP_TRANSACTION_CONTEXT_PROPAGATOR);
  });

  it('should return given transaction context in callback', (done) => {
    OpenFeature.setTransactionContext({ targetingKey: 'my-key' }, async () => {
      expect(OpenFeature.getTransactionContext()).toEqual({ targetingKey: 'my-key' });
      done();
    });
  });

  it('should not return transaction context in callstack root', (done) => {
    let resolve1: (value?: unknown) => unknown = jest.fn();
    const promise1 = new Promise((resolve) => {
      resolve1 = resolve;
    });

    OpenFeature.setTransactionContext({ targetingKey: 'my-key' }, async () => {
      expect(OpenFeature.getTransactionContext()).toEqual({ targetingKey: 'my-key' });
      await promise1;
      done();
    });

    expect(OpenFeature.getTransactionContext()).toEqual({});
    resolve1();
  });

  it('should use the assigned transaction contexts for concurrent promises', (done) => {
    let resolve1: (value?: unknown) => unknown = jest.fn();
    const promise1 = new Promise((resolve) => {
      resolve1 = resolve;
    });

    let resolve2: (value?: unknown) => unknown = jest.fn();
    const promise2 = new Promise((resolve) => {
      resolve2 = resolve;
    });

    OpenFeature.setTransactionContext({ targetingKey: 'promise-1' }, async () => {
      expect(OpenFeature.getTransactionContext()).toEqual({ targetingKey: 'promise-1' });
      resolve2();
      await promise1;
      done();
    });

    OpenFeature.setTransactionContext({ targetingKey: 'promise-2' }, async () => {
      expect(OpenFeature.getTransactionContext()).toEqual({ targetingKey: 'promise-2' });
      await promise2;
      resolve1();
    });
  });
});
