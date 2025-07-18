import type { HookData, BaseHook, BeforeHookContext, HookContext } from '../src/hooks';
import { MapHookData } from '../src/hooks';
import type { FlagValue } from '../src/evaluation';

describe('Hook Data Type Safety', () => {
  it('should provide type safety with typed hook data', () => {
    // Define a strict type for hook data
    interface MyHookData {
      startTime: number;
      userId: string;
      metadata: { version: string; feature: boolean };
      tags: string[];
    }

    const hookData = new MapHookData<MyHookData>();

    // Type-safe setting and getting
    hookData.set('startTime', 123456);
    hookData.set('userId', 'user-123');
    hookData.set('metadata', { version: '1.0.0', feature: true });
    hookData.set('tags', ['tag1', 'tag2']);

    // TypeScript should infer the correct return types
    const startTime: number | undefined = hookData.get('startTime');
    const userId: string | undefined = hookData.get('userId');
    const metadata: { version: string; feature: boolean } | undefined = hookData.get('metadata');
    const tags: string[] | undefined = hookData.get('tags');

    // Verify the values
    expect(startTime).toBe(123456);
    expect(userId).toBe('user-123');
    expect(metadata).toEqual({ version: '1.0.0', feature: true });
    expect(tags).toEqual(['tag1', 'tag2']);

    // Type-safe existence checks
    expect(hookData.has('startTime')).toBe(true);
    expect(hookData.has('userId')).toBe(true);
    expect(hookData.has('metadata')).toBe(true);
    expect(hookData.has('tags')).toBe(true);

    // Type-safe deletion
    expect(hookData.delete('tags')).toBe(true);
    expect(hookData.has('tags')).toBe(false);
  });

  it('should support untyped usage for backward compatibility', () => {
    const hookData: HookData = new MapHookData();

    // Untyped usage still works
    hookData.set('anyKey', 'anyValue');
    hookData.set('numberKey', 42);
    hookData.set('objectKey', { nested: true });

    const value: unknown = hookData.get('anyKey');
    const numberValue: unknown = hookData.get('numberKey');
    const objectValue: unknown = hookData.get('objectKey');

    expect(value).toBe('anyValue');
    expect(numberValue).toBe(42);
    expect(objectValue).toEqual({ nested: true });
  });

  it('should support mixed usage with typed and untyped keys', () => {
    interface PartiallyTypedData {
      correlationId: string;
      timestamp: number;
    }

    const hookData: HookData<PartiallyTypedData> = new MapHookData<PartiallyTypedData>();

    // Typed usage
    hookData.set('correlationId', 'abc-123');
    hookData.set('timestamp', Date.now());

    // Untyped usage for additional keys
    hookData.set('dynamicKey', 'dynamicValue');

    // Type-safe retrieval for typed keys
    const correlationId: string | undefined = hookData.get('correlationId');
    const timestamp: number | undefined = hookData.get('timestamp');

    // Untyped retrieval for dynamic keys
    const dynamicValue: unknown = hookData.get('dynamicKey');

    expect(correlationId).toBe('abc-123');
    expect(typeof timestamp).toBe('number');
    expect(dynamicValue).toBe('dynamicValue');
  });

  it('should work with complex nested types', () => {
    interface ComplexHookData {
      request: {
        id: string;
        headers: Record<string, string>;
        body?: { [key: string]: unknown };
      };
      response: {
        status: number;
        data: unknown;
        headers: Record<string, string>;
      };
      metrics: {
        startTime: number;
        endTime?: number;
        duration?: number;
      };
    }

    const hookData: HookData<ComplexHookData> = new MapHookData<ComplexHookData>();

    const requestData = {
      id: 'req-123',
      headers: { 'Content-Type': 'application/json' },
      body: { flag: 'test-flag' },
    };

    hookData.set('request', requestData);
    hookData.set('metrics', { startTime: Date.now() });

    const retrievedRequest = hookData.get('request');
    const retrievedMetrics = hookData.get('metrics');

    expect(retrievedRequest).toEqual(requestData);
    expect(retrievedMetrics?.startTime).toBeDefined();
    expect(typeof retrievedMetrics?.startTime).toBe('number');
  });

  it('should support generic type inference', () => {
    // This function demonstrates how the generic types work in practice
    function createTypedHookData<T>(): HookData<T> {
      return new MapHookData<T>();
    }

    interface TimingData {
      start: number;
      checkpoint: number;
    }

    const timingHookData = createTypedHookData<TimingData>();

    timingHookData.set('start', performance.now());
    timingHookData.set('checkpoint', performance.now());

    const start: number | undefined = timingHookData.get('start');
    const checkpoint: number | undefined = timingHookData.get('checkpoint');

    expect(typeof start).toBe('number');
    expect(typeof checkpoint).toBe('number');
  });

  it('should work with BaseHook interface without casting', () => {
    interface TestHookData {
      testId: string;
      startTime: number;
      metadata: { version: string };
    }

    class TestTypedHook implements BaseHook<FlagValue, TestHookData> {
      capturedData: { testId?: string; duration?: number } = {};

      before(hookContext: BeforeHookContext<FlagValue, TestHookData>) {
        // No casting needed - TypeScript knows the types
        hookContext.hookData.set('testId', 'test-123');
        hookContext.hookData.set('startTime', Date.now());
        hookContext.hookData.set('metadata', { version: '1.0.0' });
      }

      after(hookContext: HookContext<FlagValue, TestHookData>) {
        // Type-safe getting with proper return types
        const testId: string | undefined = hookContext.hookData.get('testId');
        const startTime: number | undefined = hookContext.hookData.get('startTime');

        if (testId && startTime) {
          this.capturedData = {
            testId,
            duration: Date.now() - startTime,
          };
        }
      }
    }

    const hook = new TestTypedHook();

    // Create mock contexts that satisfy the BaseHook interface
    const mockBeforeContext: BeforeHookContext<FlagValue, TestHookData> = {
      flagKey: 'test-flag',
      defaultValue: true,
      flagValueType: 'boolean',
      context: {},
      clientMetadata: {
        name: 'test-client',
        domain: 'test-domain',
        providerMetadata: { name: 'test-provider' },
      },
      providerMetadata: { name: 'test-provider' },
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      hookData: new MapHookData<TestHookData>(),
    };

    const mockAfterContext: HookContext<FlagValue, TestHookData> = {
      ...mockBeforeContext,
      context: Object.freeze({}),
    };

    // Execute the hook methods
    hook.before!(mockBeforeContext);
    hook.after!(mockAfterContext);

    // Verify the typed hook worked correctly
    expect(hook.capturedData.testId).toBe('test-123');
    expect(hook.capturedData.duration).toBeDefined();
    expect(typeof hook.capturedData.duration).toBe('number');
  });
});