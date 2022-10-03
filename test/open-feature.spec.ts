import { OpenFeatureClient } from '../src/client';
import { NOOP_PROVIDER } from '../src/no-op-provider';
import { NOOP_TRANSACTION_CONTEXT_PROPAGATOR } from '../src/no-op-transaction-context-propagator';
import { OpenFeature } from '../src/open-feature';
import { Provider, TransactionContextPropagator } from '../src/types';

describe('OpenFeature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.1.2', () => {
    it('should equal previously set provider', () => {
      const fakeProvider = { metadata: 'test' } as unknown as Provider;
      OpenFeature.setProvider(fakeProvider);
      expect(OpenFeature.providerMetadata === fakeProvider.metadata).toBeTruthy();
    });
  });

  describe('Requirement 1.1.3', () => {
    it('should allow addition of hooks', () => {
      expect(OpenFeature.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.1.4', () => {
    it('should implement a provider metadata accessor and mutator', () => {
      expect(OpenFeature.providerMetadata).toBeDefined();
    });
  });

  describe('Requirement 1.1.5', () => {
    it('should implement a client factory', () => {
      expect(OpenFeature.getClient).toBeDefined();
      expect(OpenFeature.getClient()).toBeInstanceOf(OpenFeatureClient);

      const name = 'my-client';
      const namedClient = OpenFeature.getClient(name);

      // check that using a named configuration also works as expected.
      expect(namedClient).toBeInstanceOf(OpenFeatureClient);
      expect(namedClient.metadata.name).toEqual(name);
    });
  });

  it('should be chainable', () => {
    const client = OpenFeature.addHooks()
      .clearHooks()
      .setContext({})
      .setLogger(console)
      .setProvider(NOOP_PROVIDER)
      .getClient();

    expect(client).toBeDefined();
  });

  describe('transaction context safety', () => {
    it('invalid getTransactionContext is not registered', () => {
      OpenFeature.setTransactionContextPropagator({ setTransactionContext: () => undefined } as unknown as TransactionContextPropagator);
      expect(OpenFeature['_transactionContextPropagator']).toBe(NOOP_TRANSACTION_CONTEXT_PROPAGATOR);
    });

    it('invalid setTransactionContext is not registered', () => {
      OpenFeature.setTransactionContextPropagator({ getTransactionContext: () => Object.assign({}) } as unknown as TransactionContextPropagator);
      expect(OpenFeature['_transactionContextPropagator']).toBe(NOOP_TRANSACTION_CONTEXT_PROPAGATOR);
    });

    it('throwing getTransactionContext defaults', async () => {
      const mockPropagator: TransactionContextPropagator = {
        getTransactionContext: jest.fn(() => {
          throw Error('Transaction context error!');
        }),
        setTransactionContext: jest.fn((context, callback) => {
          callback();
        })
      };

      OpenFeature.setTransactionContextPropagator(mockPropagator);
      expect(OpenFeature['_transactionContextPropagator']).toBe(mockPropagator);
      const client = OpenFeature.getClient();
      const result = await client.getBooleanValue('test', true);
      expect(result).toEqual(true);
      expect(mockPropagator.getTransactionContext).toHaveBeenCalled();
    });
  });
});
