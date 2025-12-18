import type { JsonValue, OpenFeatureAPI, Provider, ProviderMetadata, ResolutionDetails } from '../src';

const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/web-sdk/api');

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;

  constructor(options?: { name?: string }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
  }

  resolveBooleanEvaluation(): ResolutionDetails<boolean> {
    throw new Error('Not implemented');
  }

  resolveNumberEvaluation(): ResolutionDetails<number> {
    throw new Error('Not implemented');
  }

  resolveObjectEvaluation<T extends JsonValue>(): ResolutionDetails<T> {
    throw new Error('Not implemented');
  }

  resolveStringEvaluation(): ResolutionDetails<string> {
    throw new Error('Not implemented');
  }
}

const _globalThis = globalThis as {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};

describe('OpenFeature', () => {
  beforeEach(() => {
    Reflect.deleteProperty(_globalThis, GLOBAL_OPENFEATURE_API_KEY);
    expect(_globalThis[GLOBAL_OPENFEATURE_API_KEY]).toBeUndefined();
    jest.resetModules();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should persist via globalThis (window in browsers)', async () => {
    const firstInstance = (await import('../src')).OpenFeature;

    jest.resetModules();
    const secondInstance = (await import('../src')).OpenFeature;

    expect(firstInstance).toBe(secondInstance);
    expect(_globalThis[GLOBAL_OPENFEATURE_API_KEY]).toBe(firstInstance);
  });

  it('can also be accessed via OpenFeatureAPI.getInstance', async () => {
    const { OpenFeature, OpenFeatureAPI } = await import('../src');

    expect(OpenFeature).toBe(OpenFeatureAPI.getInstance());
  });

  describe('OpenFeature.getIsolated', () => {
    it('should not be the same instance as the global singleton', async () => {
      const { OpenFeature } = await import('../src');

      expect(OpenFeature.getIsolated()).not.toBe(OpenFeature);
    });

    it('should not be the same instance as another isolated instance', async () => {
      const { OpenFeature } = await import('../src');

      expect(OpenFeature.getIsolated()).not.toBe(OpenFeature.getIsolated());
    });

    it('can also be created via OpenFeatureAPI.getInstance', async () => {
      const { OpenFeature, OpenFeatureAPI } = await import('../src');

      expect(OpenFeatureAPI.getInstance(false)).not.toBe(OpenFeature);
    });

    it('should not share state between global and isolated instances', async () => {
      const { OpenFeature, NOOP_PROVIDER } = await import('../src');
      const isolatedInstance = OpenFeature.getIsolated();

      const globalProvider = new MockProvider({ name: 'global-provider' });
      OpenFeature.setProvider(globalProvider);

      expect(OpenFeature.getProvider()).toBe(globalProvider);
      expect(isolatedInstance.getProvider()).toBe(NOOP_PROVIDER);

      const isolatedProvider = new MockProvider({ name: 'isolated-provider' });
      isolatedInstance.setProvider(isolatedProvider);

      expect(OpenFeature.getProvider()).toBe(globalProvider);
      expect(isolatedInstance.getProvider()).toBe(isolatedProvider);
    });

    it('should not share state between two isolated instances', async () => {
      const { OpenFeature, NOOP_PROVIDER } = await import('../src');
      const isolatedInstanceOne = OpenFeature.getIsolated();
      const isolatedInstanceTwo = OpenFeature.getIsolated();

      const isolatedProviderOne = new MockProvider({ name: 'isolated-provider-one' });
      isolatedInstanceOne.setProvider(isolatedProviderOne);

      expect(isolatedInstanceOne.getProvider()).toBe(isolatedProviderOne);
      expect(isolatedInstanceTwo.getProvider()).toBe(NOOP_PROVIDER);

      const isolatedProviderTwo = new MockProvider({ name: 'isolated-provider-two' });
      isolatedInstanceTwo.setProvider(isolatedProviderTwo);

      expect(isolatedInstanceOne.getProvider()).toBe(isolatedProviderOne);
      expect(isolatedInstanceTwo.getProvider()).toBe(isolatedProviderTwo);
    });
  });
});
