import { OpenFeatureAPI } from '../src/open-feature';
import type { Client } from '../src/client';
import type {
  JsonValue,
  ResolutionDetails,
  HookContext,
  BeforeHookContext} from '@openfeature/core';
import { StandardResolutionReasons } from '@openfeature/core';
import type { Provider } from '../src/provider';
import type { Hook } from '../src/hooks';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 1;
const OBJECT_VALUE = { key: 'value' };

// A test hook that stores data in the before stage and retrieves it in after/error/finally
class TestHookWithData implements Hook {
  beforeData: unknown;
  afterData: unknown;
  errorData: unknown;
  finallyData: unknown;

  before(hookContext: BeforeHookContext) {
    // Store some data
    hookContext.hookData.set('testKey', 'testValue');
    hookContext.hookData.set('timestamp', Date.now());
    hookContext.hookData.set('object', { nested: 'value' });
    this.beforeData = hookContext.hookData.get('testKey');
  }

  after(hookContext: HookContext) {
    // Retrieve data stored in before
    this.afterData = hookContext.hookData.get('testKey');
  }

  error(hookContext: HookContext) {
    // Retrieve data stored in before
    this.errorData = hookContext.hookData.get('testKey');
  }

  finally(hookContext: HookContext) {
    // Retrieve data stored in before
    this.finallyData = hookContext.hookData.get('testKey');
  }
}

// A timing hook that measures evaluation duration
class TimingHook implements Hook {
  duration?: number;

  before(hookContext: BeforeHookContext) {
    hookContext.hookData.set('startTime', performance.now());
  }

  after(hookContext: HookContext) {
    const startTime = hookContext.hookData.get('startTime') as number;
    if (startTime) {
      this.duration = performance.now() - startTime;
    }
  }

  error(hookContext: HookContext) {
    const startTime = hookContext.hookData.get('startTime') as number;
    if (startTime) {
      this.duration = performance.now() - startTime;
    }
  }
}

// Hook that tests hook data isolation
class IsolationTestHook implements Hook {
  hookId: string;
  
  constructor(id: string) {
    this.hookId = id;
  }

  before(hookContext: BeforeHookContext) {
    // Each hook instance should have its own data
    hookContext.hookData.set('hookId', this.hookId);
    hookContext.hookData.set(`data_${this.hookId}`, `value_${this.hookId}`);
  }

  after(hookContext: HookContext) {
    // Verify we can only see our own data
    const storedId = hookContext.hookData.get('hookId');
    if (storedId !== this.hookId) {
      throw new Error(`Hook data isolation violated! Expected ${this.hookId}, got ${storedId}`);
    }
  }
}

// Mock provider for testing
const MOCK_PROVIDER: Provider = {
  metadata: { name: 'mock-provider' },
  resolveBooleanEvaluation(): ResolutionDetails<boolean> {
    return {
      value: BOOLEAN_VALUE,
      variant: 'default',
      reason: StandardResolutionReasons.DEFAULT,
    };
  },
  resolveStringEvaluation(): ResolutionDetails<string> {
    return {
      value: STRING_VALUE,
      variant: 'default', 
      reason: StandardResolutionReasons.DEFAULT,
    };
  },
  resolveNumberEvaluation(): ResolutionDetails<number> {
    return {
      value: NUMBER_VALUE,
      variant: 'default',
      reason: StandardResolutionReasons.DEFAULT,
    };
  },
  resolveObjectEvaluation<T extends JsonValue>(): ResolutionDetails<T> {
    return {
      value: OBJECT_VALUE as unknown as T,
      variant: 'default',
      reason: StandardResolutionReasons.DEFAULT,
    };
  },
} as Provider;

// Mock provider that throws an error
const ERROR_PROVIDER: Provider = {
  metadata: { name: 'error-provider' },
  resolveBooleanEvaluation(): ResolutionDetails<boolean> {
    throw new Error('Provider error');
  },
  resolveStringEvaluation(): ResolutionDetails<string> {
    throw new Error('Provider error');
  },
  resolveNumberEvaluation(): ResolutionDetails<number> {
    throw new Error('Provider error');
  },
  resolveObjectEvaluation<T extends JsonValue>(): ResolutionDetails<T> {
    throw new Error('Provider error');
  },
};

describe('Hook Data (Web SDK)', () => {
  let client: Client;
  let api: OpenFeatureAPI;

  beforeEach(() => {
    api = OpenFeatureAPI.getInstance();
    api.clearHooks();
    api.setProvider(MOCK_PROVIDER);
    client = api.getClient();
  });

  afterEach(() => {
    api.clearProviders();
  });

  describe('Basic Hook Data Functionality', () => {
    it('should allow hooks to store and retrieve data across stages', () => {
      const hook = new TestHookWithData();
      client.addHooks(hook);

      client.getBooleanValue('test-flag', false);

      // Verify data was stored in before and retrieved in all other stages
      expect(hook.beforeData).toBe('testValue');
      expect(hook.afterData).toBe('testValue');
      expect(hook.finallyData).toBe('testValue');
    });

    it('should support storing different data types', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storedValues: any = {};

      const hook: Hook = {
        before(hookContext: BeforeHookContext) {
          // Store various types
          hookContext.hookData.set('string', 'test');
          hookContext.hookData.set('number', 42);
          hookContext.hookData.set('boolean', true);
          hookContext.hookData.set('object', { key: 'value' });
          hookContext.hookData.set('array', [1, 2, 3]);
          hookContext.hookData.set('null', null);
          hookContext.hookData.set('undefined', undefined);
        },

        after(hookContext: HookContext) {
          storedValues.string = hookContext.hookData.get('string');
          storedValues.number = hookContext.hookData.get('number');
          storedValues.boolean = hookContext.hookData.get('boolean');
          storedValues.object = hookContext.hookData.get('object');
          storedValues.array = hookContext.hookData.get('array');
          storedValues.null = hookContext.hookData.get('null');
          storedValues.undefined = hookContext.hookData.get('undefined');
        },
      };

      client.addHooks(hook);
      client.getBooleanValue('test-flag', false);

      expect(storedValues.string).toBe('test');
      expect(storedValues.number).toBe(42);
      expect(storedValues.boolean).toBe(true);
      expect(storedValues.object).toEqual({ key: 'value' });
      expect(storedValues.array).toEqual([1, 2, 3]);
      expect(storedValues.null).toBeNull();
      expect(storedValues.undefined).toBeUndefined();
    });

    it('should handle hook data in error scenarios', () => {
      api.setProvider(ERROR_PROVIDER);
      const hook = new TestHookWithData();
      client.addHooks(hook);

      client.getBooleanValue('test-flag', false);

      // Verify data was accessible in error and finally stages
      expect(hook.beforeData).toBe('testValue');
      expect(hook.errorData).toBe('testValue');
      expect(hook.finallyData).toBe('testValue');
      expect(hook.afterData).toBeUndefined(); // after should not run on error
    });
  });

  describe('Hook Data API', () => {
    it('should support has() method', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasResults: any = {};

      const hook: Hook = {
        before(hookContext: BeforeHookContext) {
          hookContext.hookData.set('exists', 'value');
          hasResults.beforeExists = hookContext.hookData.has('exists');
          hasResults.beforeNotExists = hookContext.hookData.has('notExists');
        },

        after(hookContext: HookContext) {
          hasResults.afterExists = hookContext.hookData.has('exists');
          hasResults.afterNotExists = hookContext.hookData.has('notExists');
        },
      };

      client.addHooks(hook);
      client.getBooleanValue('test-flag', false);

      expect(hasResults.beforeExists).toBe(true);
      expect(hasResults.beforeNotExists).toBe(false);
      expect(hasResults.afterExists).toBe(true);
      expect(hasResults.afterNotExists).toBe(false);
    });

    it('should support delete() method', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deleteResults: any = {};

      const hook: Hook = {
        before(hookContext: BeforeHookContext) {
          hookContext.hookData.set('toDelete', 'value');
          deleteResults.hasBeforeDelete = hookContext.hookData.has('toDelete');
          deleteResults.deleteResult = hookContext.hookData.delete('toDelete');
          deleteResults.hasAfterDelete = hookContext.hookData.has('toDelete');
          deleteResults.deleteAgainResult = hookContext.hookData.delete('toDelete');
        },
      };

      client.addHooks(hook);
      client.getBooleanValue('test-flag', false);

      expect(deleteResults.hasBeforeDelete).toBe(true);
      expect(deleteResults.deleteResult).toBe(true);
      expect(deleteResults.hasAfterDelete).toBe(false);
      expect(deleteResults.deleteAgainResult).toBe(false);
    });

    it('should support clear() method', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clearResults: any = {};

      const hook: Hook = {
        before(hookContext: BeforeHookContext) {
          hookContext.hookData.set('key1', 'value1');
          hookContext.hookData.set('key2', 'value2');
          hookContext.hookData.set('key3', 'value3');
          clearResults.hasBeforeClear = hookContext.hookData.has('key1');
          hookContext.hookData.clear();
          clearResults.hasAfterClear = hookContext.hookData.has('key1');
        },

        after(hookContext: HookContext) {
          // Verify all data was cleared
          clearResults.afterHasKey1 = hookContext.hookData.has('key1');
          clearResults.afterHasKey2 = hookContext.hookData.has('key2');
          clearResults.afterHasKey3 = hookContext.hookData.has('key3');
        },
      };

      client.addHooks(hook);
      client.getBooleanValue('test-flag', false);

      expect(clearResults.hasBeforeClear).toBe(true);
      expect(clearResults.hasAfterClear).toBe(false);
      expect(clearResults.afterHasKey1).toBe(false);
      expect(clearResults.afterHasKey2).toBe(false);
      expect(clearResults.afterHasKey3).toBe(false);
    });
  });

  describe('Hook Data Isolation', () => {
    it('should isolate data between different hook instances', () => {
      const hook1 = new IsolationTestHook('hook1');
      const hook2 = new IsolationTestHook('hook2');
      const hook3 = new IsolationTestHook('hook3');

      client.addHooks(hook1, hook2, hook3);

      // This should not throw if isolation is working correctly
      client.getBooleanValue('test-flag', false);
    });

    it('should not share data between different evaluations', () => {
      let firstEvalData: unknown;
      let secondEvalData: unknown;

      const hook: Hook = {
        before(hookContext: BeforeHookContext) {
          // Check if data exists from previous evaluation
          const existingData = hookContext.hookData.get('evalData');
          if (existingData) {
            throw new Error('Hook data leaked between evaluations!');
          }
          hookContext.hookData.set('evalData', 'evaluation-specific');
        },

        after(hookContext: HookContext) {
          if (!firstEvalData) {
            firstEvalData = hookContext.hookData.get('evalData');
          } else {
            secondEvalData = hookContext.hookData.get('evalData');
          }
        },
      };

      client.addHooks(hook);

      // First evaluation
      client.getBooleanValue('test-flag', false);
      // Second evaluation
      client.getBooleanValue('test-flag', false);

      expect(firstEvalData).toBe('evaluation-specific');
      expect(secondEvalData).toBe('evaluation-specific');
    });

    it('should isolate data between global, client, and invocation hooks', () => {
      const globalHook = new IsolationTestHook('global');
      const clientHook = new IsolationTestHook('client');
      const invocationHook = new IsolationTestHook('invocation');

      api.addHooks(globalHook);
      client.addHooks(clientHook);

      // This should not throw if isolation is working correctly
      client.getBooleanValue('test-flag', false, { hooks: [invocationHook] });
    });
  });

  describe('Use Cases', () => {
    it('should support timing measurements', () => {
      const timingHook = new TimingHook();
      client.addHooks(timingHook);

      client.getBooleanValue('test-flag', false);

      expect(timingHook.duration).toBeDefined();
      expect(timingHook.duration).toBeGreaterThanOrEqual(0);
    });

    it('should support multi-stage validation accumulation', () => {
      let finalErrors: string[] = [];

      const validationHook: Hook = {
        before(hookContext: BeforeHookContext) {
          hookContext.hookData.set('errors', []);
          
          // Simulate validation
          const errors = hookContext.hookData.get('errors') as string[];
          if (!hookContext.context.userId) {
            errors.push('Missing userId');
          }
          if (!hookContext.context.region) {
            errors.push('Missing region');
          }
        },

        finally(hookContext: HookContext) {
          finalErrors = hookContext.hookData.get('errors') as string[] || [];
        },
      };

      client.addHooks(validationHook);
      client.getBooleanValue('test-flag', false, {});

      expect(finalErrors).toContain('Missing userId');
      expect(finalErrors).toContain('Missing region');
    });

    it('should support request correlation', () => {
      let correlationId: string | undefined;

      const correlationHook: Hook = {
        before(hookContext: BeforeHookContext) {
          const id = `req-${Date.now()}-${Math.random()}`;
          hookContext.hookData.set('correlationId', id);
        },

        after(hookContext: HookContext) {
          correlationId = hookContext.hookData.get('correlationId') as string;
        },
      };

      client.addHooks(correlationHook);
      client.getBooleanValue('test-flag', false);

      expect(correlationId).toBeDefined();
      expect(correlationId).toMatch(/^req-\d+-[\d.]+$/);
    });
  });
});