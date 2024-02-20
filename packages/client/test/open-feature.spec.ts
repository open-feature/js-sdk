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
        expect(() => OpenFeature.setProvider(provider)).toThrow(
          "Provider 'mock-events-success' is intended for use on the server.",
        );
      });
      it('should succeed because the provider is intended for the client', () => {
        const provider = mockProvider({ runsOn: 'client' });
        expect(() => OpenFeature.setProvider(provider)).not.toThrow();
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
    it('should set the default provider if no domain is provided', () => {
      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      const client = OpenFeature.getClient();
      expect(client.metadata.providerMetadata.name).toEqual(provider.metadata.name);
    });

    it('should not change providers associated with a domain when setting a new default provider', () => {
      const domain = 'my-domain';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;
      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      OpenFeature.setProvider(domain, fakeProvider);

      const defaultClient = OpenFeature.getClient();
      const domainSpecificClient = OpenFeature.getClient(domain);

      expect(defaultClient.metadata.providerMetadata.name).toEqual(provider.metadata.name);
      expect(domainSpecificClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
    });

    it('should bind a new provider to existing clients in a matching domain', () => {
      const domain = 'my-domain';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;

      const provider = mockProvider();
      OpenFeature.setProvider(provider);
      const domainSpecificClient = OpenFeature.getClient(domain);
      OpenFeature.setProvider(domain, fakeProvider);

      expect(domainSpecificClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
    });

    it('should close a provider if it is replaced and no other client uses it', async () => {
      const provider1 = { ...mockProvider(), onClose: jest.fn() };
      const provider2 = { ...mockProvider(), onClose: jest.fn() };

      OpenFeature.setProvider('domain1', provider1);
      expect(provider1.onClose).not.toHaveBeenCalled();
      OpenFeature.setProvider('domain1', provider2);
      expect(provider1.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close provider if it is used by another client', async () => {
      const provider1 = { ...mockProvider(), onClose: jest.fn() };

      OpenFeature.setProvider('domain1', provider1);
      OpenFeature.setProvider('domain2', provider1);

      OpenFeature.setProvider('domain1', { ...provider1 });
      expect(provider1.onClose).not.toHaveBeenCalled();

      OpenFeature.setProvider('domain2', { ...provider1 });
      expect(provider1.onClose).toHaveBeenCalledTimes(1);
    });

    it('should return the default provider metadata when passing an unregistered domain', async () => {
      const mockProvider = { metadata: { name: 'test' } } as unknown as Provider;
      OpenFeature.setProvider(mockProvider);
      const metadata = OpenFeature.getProviderMetadata('unused');
      expect(metadata.name === mockProvider.metadata.name).toBeTruthy();
    });

    it('should return domain specific provider metadata when passing a registered domain', async () => {
      const mockProvider = { metadata: { name: 'mock' } } as unknown as Provider;
      const mockDomainProvider = { metadata: { name: 'named-mock' } } as unknown as Provider;
      OpenFeature.setProvider(mockProvider);
      OpenFeature.setProvider('mocked', mockDomainProvider);
      const metadata = OpenFeature.getProviderMetadata('mocked');
      expect(metadata.name === mockDomainProvider.metadata.name).toBeTruthy();
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

      const domain = 'my-domain';
      const domainSpecificClient = OpenFeature.getClient(domain);

      // check that using a named configuration also works as expected.
      expect(domainSpecificClient).toBeInstanceOf(OpenFeatureClient);
      // Alias for domain, left for backwards compatibility
      expect(domainSpecificClient.metadata.name).toEqual(domain);
      expect(domainSpecificClient.metadata.domain).toEqual(domain);
    });

    it('should return a client with the default provider if no provider has been bound to the domain', () => {
      const domainSpecificClient = OpenFeature.getClient('unbound');
      expect(domainSpecificClient.metadata.providerMetadata.name).toEqual(OpenFeature.providerMetadata.name);
    });

    it('should return a client with the provider bound to the domain', () => {
      const domain = 'my-domain';
      const fakeProvider = { metadata: { name: 'test' } } as unknown as Provider;
      OpenFeature.setProvider(domain, fakeProvider);

      const domainSpecificClient = OpenFeature.getClient(domain);

      expect(domainSpecificClient.metadata.providerMetadata.name).toEqual(fakeProvider.metadata.name);
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
      OpenFeature.setProvider('domain1', { ...provider });
      OpenFeature.setProvider('domain2', { ...provider });

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
      OpenFeature.setProvider('domain1', provider2);
      OpenFeature.setProvider('domain2', provider3);

      expect(OpenFeature.providerMetadata.name).toBe(provider1.metadata.name);
      await OpenFeature.close();
      expect(provider3.onClose).toHaveBeenCalled();
    });

    describe('context during initialization', () => {
      it('should use the context set in the domain', async () => {
        const domain = 'test';
        await OpenFeature.setContext(domain, { user: 'mike' });

        const provider = mockProvider();
        const spy = jest.spyOn(provider, 'initialize');
        OpenFeature.setProvider(domain, provider);

        expect(spy).toHaveBeenCalledWith({ user: 'mike' });
      });

      it('should use the default context', async () => {
        const domain = 'test';
        await OpenFeature.setContext(domain, { user: 'mike' });
        await OpenFeature.setContext({ name: 'todd' });

        const provider = mockProvider();
        const spy = jest.spyOn(provider, 'initialize');
        OpenFeature.setProvider(provider);

        expect(spy).toHaveBeenCalledWith({ name: 'todd' });
      });
    });
  });
});
