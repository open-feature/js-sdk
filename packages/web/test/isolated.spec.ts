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

  describe('OpenFeature.isolated', () => {
    it('should not be the same instance as the global singleton', async () => {
      const { OpenFeature } = await import('../src');

      expect(OpenFeature.isolated).not.toBe(OpenFeature);
    });

    it('should not share state between global and isolated instances', async () => {
      const { OpenFeature, NOOP_PROVIDER } = await import('../src');
      const isolatedInstance = OpenFeature.isolated;

      const globalProvider = new MockProvider({ name: 'global-provider' });
      OpenFeature.setProvider(globalProvider);

      expect(OpenFeature.getProvider()).toBe(globalProvider);
      expect(isolatedInstance.getProvider()).toBe(NOOP_PROVIDER);

      const isolatedProvider = new MockProvider({ name: 'isolated-provider' });
      isolatedInstance.setProvider(isolatedProvider);

      expect(OpenFeature.getProvider()).toBe(globalProvider);
      expect(isolatedInstance.getProvider()).toBe(isolatedProvider);
    });

    it('should persist when imported multiple times', async () => {
      const firstIsolatedInstance = (await import('../src')).OpenFeature.isolated;
      const secondIsolatedInstance = (await import('../src')).OpenFeature.isolated;

      expect(firstIsolatedInstance).toBe(secondIsolatedInstance);
    });

    it('should not persist via globalThis (window in browsers)', async () => {
      const firstIsolatedInstance = (await import('../src')).OpenFeature.isolated;

      jest.resetModules();
      const secondIsolatedInstance = (await import('../src')).OpenFeature.isolated;

      expect(firstIsolatedInstance).not.toBe(secondIsolatedInstance);
    });
  });
});
