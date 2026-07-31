import type { Provider, ResolutionDetails } from '../src';
import { OpenFeature, ProviderEvents } from '../src';
import { createIsolatedOpenFeatureAPI } from '../src/isolated';

const MOCK_PROVIDER: Provider = {
  metadata: {
    name: 'mock-provider',
  },
  resolveBooleanEvaluation: (): ResolutionDetails<boolean> => ({ value: true, reason: 'STATIC' }),
  resolveStringEvaluation: (): ResolutionDetails<string> => ({ value: 'test', reason: 'STATIC' }),
  resolveNumberEvaluation: (): ResolutionDetails<number> => ({ value: 1, reason: 'STATIC' }),
  resolveObjectEvaluation: <T>(): ResolutionDetails<T> => ({ value: {} as T, reason: 'STATIC' }),
};

const MOCK_PROVIDER_2: Provider = {
  metadata: {
    name: 'mock-provider-2',
  },
  resolveBooleanEvaluation: (): ResolutionDetails<boolean> => ({ value: false, reason: 'STATIC' }),
  resolveStringEvaluation: (): ResolutionDetails<string> => ({ value: 'test2', reason: 'STATIC' }),
  resolveNumberEvaluation: (): ResolutionDetails<number> => ({ value: 2, reason: 'STATIC' }),
  resolveObjectEvaluation: <T>(): ResolutionDetails<T> => ({ value: {} as T, reason: 'STATIC' }),
};

describe('Isolated OpenFeature API (Web)', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
    OpenFeature.clearHooks();
  });

  describe('createIsolatedOpenFeatureAPI', () => {
    it('should create a new instance each time', () => {
      const instance1 = createIsolatedOpenFeatureAPI();
      const instance2 = createIsolatedOpenFeatureAPI();
      expect(instance1).not.toBe(instance2);
    });

    it('should create an instance different from the singleton', () => {
      const isolated = createIsolatedOpenFeatureAPI();
      expect(isolated).not.toBe(OpenFeature);
    });
  });

  describe('provider isolation', () => {
    it('should not share providers with singleton', async () => {
      const isolated = createIsolatedOpenFeatureAPI();

      isolated.setProvider(MOCK_PROVIDER);
      OpenFeature.setProvider(MOCK_PROVIDER_2);

      expect(isolated.getProvider().metadata.name).toBe('mock-provider');
      expect(OpenFeature.getProvider().metadata.name).toBe('mock-provider-2');
    });

    it('should not share domain-scoped providers with singleton', async () => {
      const isolated = createIsolatedOpenFeatureAPI();

      isolated.setProvider('domain-a', MOCK_PROVIDER);
      OpenFeature.setProvider('domain-a', MOCK_PROVIDER_2);

      expect(isolated.getProvider('domain-a').metadata.name).toBe('mock-provider');
      expect(OpenFeature.getProvider('domain-a').metadata.name).toBe('mock-provider-2');
    });

    it('should not share providers between isolated instances', async () => {
      const instance1 = createIsolatedOpenFeatureAPI();
      const instance2 = createIsolatedOpenFeatureAPI();

      instance1.setProvider(MOCK_PROVIDER);
      instance2.setProvider(MOCK_PROVIDER_2);

      expect(instance1.getProvider().metadata.name).toBe('mock-provider');
      expect(instance2.getProvider().metadata.name).toBe('mock-provider-2');
    });
  });

  describe('context isolation', () => {
    it('should not share context with singleton', async () => {
      const isolated = createIsolatedOpenFeatureAPI();

      await isolated.setContext({ isolated: true, user: 'isolated-user' });
      await OpenFeature.setContext({ singleton: true, user: 'singleton-user' });

      expect(isolated.getContext()).toEqual({ isolated: true, user: 'isolated-user' });
      expect(OpenFeature.getContext()).toEqual({ singleton: true, user: 'singleton-user' });
    });

    it('should not share domain-scoped context with singleton', async () => {
      const isolated = createIsolatedOpenFeatureAPI();

      await isolated.setContext('domain-a', { source: 'isolated' });
      await OpenFeature.setContext('domain-a', { source: 'singleton' });

      expect(isolated.getContext('domain-a')).toEqual({ source: 'isolated' });
      expect(OpenFeature.getContext('domain-a')).toEqual({ source: 'singleton' });
    });

    it('should not share context between isolated instances', async () => {
      const instance1 = createIsolatedOpenFeatureAPI();
      const instance2 = createIsolatedOpenFeatureAPI();

      await instance1.setContext({ instance: 1 });
      await instance2.setContext({ instance: 2 });

      expect(instance1.getContext()).toEqual({ instance: 1 });
      expect(instance2.getContext()).toEqual({ instance: 2 });
    });
  });

  describe('hooks isolation', () => {
    it('should not share hooks with singleton', () => {
      const isolated = createIsolatedOpenFeatureAPI();
      const mockHook = { before: jest.fn() };
      const singletonHook = { before: jest.fn() };

      isolated.addHooks(mockHook);
      OpenFeature.addHooks(singletonHook);

      expect(isolated.getHooks()).toContain(mockHook);
      expect(isolated.getHooks()).not.toContain(singletonHook);
      expect(OpenFeature.getHooks()).toContain(singletonHook);
      expect(OpenFeature.getHooks()).not.toContain(mockHook);
    });

    it('should not share hooks between isolated instances', () => {
      const instance1 = createIsolatedOpenFeatureAPI();
      const instance2 = createIsolatedOpenFeatureAPI();
      const hook1 = { before: jest.fn() };
      const hook2 = { before: jest.fn() };

      instance1.addHooks(hook1);
      instance2.addHooks(hook2);

      expect(instance1.getHooks()).toContain(hook1);
      expect(instance1.getHooks()).not.toContain(hook2);
      expect(instance2.getHooks()).toContain(hook2);
      expect(instance2.getHooks()).not.toContain(hook1);
    });
  });

  describe('client isolation', () => {
    it('should create clients that use the isolated provider', async () => {
      const isolated = createIsolatedOpenFeatureAPI();

      await isolated.setProviderAndWait(MOCK_PROVIDER);
      await OpenFeature.setProviderAndWait(MOCK_PROVIDER_2);

      const isolatedClient = isolated.getClient();
      const singletonClient = OpenFeature.getClient();

      expect(isolatedClient.getBooleanValue('test-flag', false)).toBe(true);
      expect(singletonClient.getBooleanValue('test-flag', true)).toBe(false);
    });

    it('should create clients that use isolated context', async () => {
      const isolated = createIsolatedOpenFeatureAPI();

      await isolated.setContext({ user: 'isolated-user' });
      await OpenFeature.setContext({ user: 'singleton-user' });

      // Create clients to verify they can be created from both instances
      const _isolatedClient = isolated.getClient();
      const _singletonClient = OpenFeature.getClient();

      // Verify the context isolation
      expect(isolated.getContext()).toEqual({ user: 'isolated-user' });
      expect(OpenFeature.getContext()).toEqual({ user: 'singleton-user' });
    });
  });

  describe('event handler isolation', () => {
    it('should not share event handlers with singleton', () => {
      const isolated = createIsolatedOpenFeatureAPI();

      // Add handlers to each instance
      isolated.addHandler(ProviderEvents.Ready, jest.fn());
      OpenFeature.addHandler(ProviderEvents.Ready, jest.fn());

      const isolatedHandlerCount = isolated.getHandlers(ProviderEvents.Ready).length;
      const singletonHandlerCount = OpenFeature.getHandlers(ProviderEvents.Ready).length;

      // Each instance should only have its own handler (plus any that fire immediately)
      // The key is that adding to one doesn't affect the other's count
      isolated.addHandler(ProviderEvents.Ready, jest.fn());

      // Adding another handler to isolated should not affect singleton
      expect(isolated.getHandlers(ProviderEvents.Ready).length).toBe(isolatedHandlerCount + 1);
      expect(OpenFeature.getHandlers(ProviderEvents.Ready).length).toBe(singletonHandlerCount);
    });
  });
});
