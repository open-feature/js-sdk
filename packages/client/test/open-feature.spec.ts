import { Paradigm } from '@openfeature/core';
import { OpenFeature, OpenFeatureAPI, OpenFeatureClient, Provider, ProviderStatus } from '../src';

const mockProvider = (config?: { initialStatus?: ProviderStatus; runsOn?: Paradigm }) => {
  return {
    metadata: {
      name: 'mock-events-success',
    },
    runsOn: config?.runsOn || 'client',
    status: config?.initialStatus || ProviderStatus.NOT_READY,
    initialize: jest.fn(() => {
      return Promise.resolve('started');
    }),
    onClose: jest.fn(() => {
      return Promise.resolve('closed');
    }),
  } as unknown as Provider;
};

describe('OpenFeature', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
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

    describe('Requirement 1.1.2.1', () => {
      it('should throw because the provider is not intended for the client', () => {
        const provider = mockProvider({ runsOn: 'server' });
        expect(() => OpenFeature.setProvider(provider)).toThrowError(
          "Provider 'mock-events-success' is intended for use on the server."
        );
      });
      it('should succeed because the provider is intended for the client', () => {
        const provider = mockProvider({ runsOn: 'client' });
        expect(() => OpenFeature.setProvider(provider)).not.toThrowError();
      });
    });

    describe('Requirement 1.1.2.2', () => {
      it('MUST invoke the `initialize` function on the newly registered provider before using it to resolve flag values', () => {
        const provider = mockProvider();
        OpenFeature.setProvider(provider);
        expect(OpenFeature.providerMetadata.name).toBe('mock-events-success');
        expect(provider.initialize).toHaveBeenCalled();
      });

      it('should not invoke initialize function if the provider is not in state NOT_READY', () => {
        const provider = mockProvider({ initialStatus: ProviderStatus.READY });
        OpenFeature.setProvider(provider);
        expect(OpenFeature.providerMetadata.name).toBe('mock-events-success');
        expect(provider.initialize).not.toHaveBeenCalled();
      });
    });

    describe('Requirement 1.1.2.3', () => {
      it("MUST invoke the `shutdown` function on the previously registered provider once it's no longer being used to resolve flag values.", () => {
        const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;
        const provider = mockProvider();
        OpenFeature.setProvider(provider);
        OpenFeature.setProvider(fakeProvider);
        expect(provider.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Requirement 1.1.3', () => {
    it('should set the default provider if no name is provided', () => {
      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      const client = OpenFeature.getClient();
      expect(client.metadata.providerMetadata.name).toEqual(provider.metadata.name);
    });

    it('should not change named providers when setting a new default provider', () => {
      const name = 'my-client';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;
      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      OpenFeature.setProvider(name, fakeProvider);

      const unnamedClient = OpenFeature.getClient();
      const namedClient = OpenFeature.getClient(name);

      expect(unnamedClient.metadata.providerMetadata.name).toEqual(provider.metadata.name);
      expect(namedClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
    });

    it('should assign a new provider to existing clients', () => {
      const name = 'my-client';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;

      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      const namedClient = OpenFeature.getClient(name);
      OpenFeature.setProvider(name, fakeProvider);

      expect(namedClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
    });

    it('should close a provider if it is replaced and no other client uses it', async () => {
      const provider1 = { ...mockProvider(), onClose: jest.fn() };
      const provider2 = { ...mockProvider(), onClose: jest.fn() };

      OpenFeature.setProvider('client1', provider1);
      expect(provider1.onClose).not.toHaveBeenCalled();
      OpenFeature.setProvider('client1', provider2);
      expect(provider1.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close provider if it is used by another client', async () => {
      const provider1 = { ...mockProvider(), onClose: jest.fn() };

      OpenFeature.setProvider('client1', provider1);
      OpenFeature.setProvider('client2', provider1);

      OpenFeature.setProvider('client1', { ...provider1 });
      expect(provider1.onClose).not.toHaveBeenCalled();

      OpenFeature.setProvider('client2', { ...provider1 });
      expect(provider1.onClose).toHaveBeenCalledTimes(1);
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
      const name = 'my-named-client';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;
      OpenFeature.setProvider(name, fakeProvider);

      const namedClient = OpenFeature.getClient(name);

      expect(namedClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
    });

    it('should be chainable', () => {
      const client = OpenFeature.addHooks().clearHooks().setLogger(console).getClient();
      expect(client).toBeDefined();
    });
  });

  describe('Requirement 1.6.1', () => {
    it('MUST define a `shutdown` function, which, when called, must call the respective `shutdown` function on the active provider', async () => {
      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      expect(OpenFeature.providerMetadata.name).toBe('mock-events-success');
      await OpenFeature.close();
      expect(provider.onClose).toHaveBeenCalled();
    });

    it('runs the shutdown function on all providers for all clients', async () => {
      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      OpenFeature.setProvider('client1', { ...provider });
      OpenFeature.setProvider('client2', { ...provider });

      expect(OpenFeature.providerMetadata.name).toBe(provider.metadata.name);
      await OpenFeature.close();
      expect(provider.onClose).toHaveBeenCalledTimes(3);
    });

    it('runs the shutdown function on all providers for all clients even if some fail', async () => {
      const failingClose = jest.fn(() => {
        throw Error();
      });

      const provider1 = { ...mockProvider(), onClose: failingClose };
      const provider2 = { ...mockProvider(), onClose: failingClose };
      const provider3 = mockProvider();

      OpenFeature.setProvider(provider1);
      OpenFeature.setProvider('client1', provider2);
      OpenFeature.setProvider('client2', provider3);

      expect(OpenFeature.providerMetadata.name).toBe(provider1.metadata.name);
      await OpenFeature.close();
      expect(provider3.onClose).toHaveBeenCalled();
    });
  });
});
