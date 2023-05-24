import { NOOP_TRANSACTION_CONTEXT_PROPAGATOR, TransactionContextPropagator } from '@openfeature/shared';
import { OpenFeatureClient } from '../src/client';
import { NOOP_PROVIDER } from '../src/no-op-provider';
import { OpenFeature, OpenFeatureAPI } from '../src/open-feature';
import { Provider } from '../src/types';

const MOCK_PROVIDER: Provider = {
  metadata: {
    name: 'mock',
  },
} as unknown as Provider;

describe('OpenFeature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.1.1', () => {
    it('OpenFeatureAPI should be a singleton', () => {
      expect(OpenFeature === OpenFeatureAPI.getInstance()).toBeTruthy();
    });
  });

  describe('Requirement 1.1.2', () => {
    it('should equal previously set provider', () => {
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;
      OpenFeature.setProvider(fakeProvider);
      expect(OpenFeature.providerMetadata === fakeProvider.metadata).toBeTruthy();
    });
  });

  describe('Requirement 1.1.3', () => {
    it('should set the default provider if no name is provided', () => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      const client = OpenFeature.getClient();
      expect(client.metadata.providerMetadata.name).toEqual(MOCK_PROVIDER.metadata.name);
    });

    it('should not change named providers when setting a new default provider', () => {
      const name = 'my-client';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;
      OpenFeature.setProvider(MOCK_PROVIDER);
      OpenFeature.setProvider(name, fakeProvider);

      const unnamedClient = OpenFeature.getClient();
      const namedClient = OpenFeature.getClient(name);

      expect(unnamedClient.metadata.providerMetadata.name).toEqual(MOCK_PROVIDER.metadata.name);
      expect(namedClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
    });

    it('should assign a new provider to existing clients', () => {
      const name = 'my-client';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;

      OpenFeature.setProvider(MOCK_PROVIDER);
      const namedClient = OpenFeature.getClient(name);
      OpenFeature.setProvider(name, fakeProvider);

      expect(namedClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
    });
  });

  describe('Requirement 1.1.4', () => {
    it('should allow addition of hooks', () => {
      expect(OpenFeature.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.1.5', () => {
    it('should implement a provider metadata accessor and mutator', () => {
      expect(OpenFeature.providerMetadata).toBeDefined();
    });
  });

  describe('Requirement 1.1.6', () => {
    it('should implement a client factory', () => {
      expect(OpenFeature.getClient).toBeDefined();
      expect(OpenFeature.getClient()).toBeInstanceOf(OpenFeatureClient);

      const name = 'my-client';
      const namedClient = OpenFeature.getClient(name);

      // check that using a named configuration also works as expected.
      expect(namedClient).toBeInstanceOf(OpenFeatureClient);
      expect(namedClient.metadata.name).toEqual(name);
    });

    it('should return a client with the default provider if no provider has been bound to the name', () => {
      const namedClient = OpenFeature.getClient('unbound');
      expect(namedClient.metadata.providerMetadata.name).toEqual(OpenFeature.providerMetadata.name);
    });

    it('should return a client with the provider bound to the name', () => {
      const name = 'my-client';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;

      OpenFeature.setProvider(name, fakeProvider);
      const namedClient = OpenFeature.getClient(name);

      expect(namedClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
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
      OpenFeature.setTransactionContextPropagator({
        setTransactionContext: () => undefined,
      } as unknown as TransactionContextPropagator);
      expect(OpenFeature['_transactionContextPropagator']).toBe(NOOP_TRANSACTION_CONTEXT_PROPAGATOR);
    });

    it('invalid setTransactionContext is not registered', () => {
      OpenFeature.setTransactionContextPropagator({
        getTransactionContext: () => Object.assign({}),
      } as unknown as TransactionContextPropagator);
      expect(OpenFeature['_transactionContextPropagator']).toBe(NOOP_TRANSACTION_CONTEXT_PROPAGATOR);
    });

    it('throwing getTransactionContext defaults', async () => {
      const mockPropagator: TransactionContextPropagator = {
        getTransactionContext: jest.fn(() => {
          throw Error('Transaction context error!');
        }),
        setTransactionContext: jest.fn((context, callback) => {
          callback();
        }),
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
