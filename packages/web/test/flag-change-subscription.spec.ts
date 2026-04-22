import { v4 as uuid } from 'uuid';
import type { Provider, ResolutionDetails, JsonValue, EvaluationDetails } from '../src';
import { OpenFeature, ProviderEvents } from '../src';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 10;
const OBJECT_VALUE: JsonValue = { key: 'value' };

const REASON = 'mocked-value';

const createMockProvider = (): Provider => ({
  metadata: {
    name: 'mock',
  },
  events: undefined,
  hooks: [],
  initialize(): Promise<void> {
    return Promise.resolve(undefined);
  },
  onClose(): Promise<void> {
    return Promise.resolve(undefined);
  },
  onContextChange(): Promise<void> {
    return Promise.resolve(undefined);
  },

  resolveNumberEvaluation: jest.fn((): ResolutionDetails<number> => {
    return {
      value: NUMBER_VALUE,
      reason: REASON,
    };
  }),

  resolveObjectEvaluation: jest.fn(<U extends JsonValue>(): ResolutionDetails<U> => {
    return <ResolutionDetails<U>>{
      value: OBJECT_VALUE as U,
      reason: REASON,
    };
  }) as <U>() => ResolutionDetails<U>,

  resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
    return {
      value: BOOLEAN_VALUE,
      reason: REASON,
    };
  }),
  resolveStringEvaluation: jest.fn((): ResolutionDetails<string> => {
    return {
      value: STRING_VALUE,
      reason: REASON,
    };
  }),
});

describe('Flag Value Change Subscriptions', () => {
  let domain: string;
  let mockProvider: Provider;

  beforeEach(async () => {
    domain = uuid();
    mockProvider = createMockProvider();
    await OpenFeature.setProviderAndWait(domain, mockProvider);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await OpenFeature.clearProviders();
    OpenFeature.clearHandlers();
    jest.clearAllMocks();
  });

  describe('Client-level onBooleanChanged', () => {
    it('should fire callback immediately and when context changes', async () => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;
      let resolveDone: () => void;
      const donePromise = new Promise<void>((resolve) => {
        resolveDone = resolve;
      });

      client.onBooleanChanged('test-flag', false, (newDetails, oldDetails) => {
        callCount++;
        if (callCount === 1) {
          // Initial callback
          expect(newDetails.value).toBe(BOOLEAN_VALUE);
          expect(oldDetails.value).toBe(BOOLEAN_VALUE);
          expect(newDetails.flagKey).toBe('test-flag');
          expect(oldDetails.flagKey).toBe('test-flag');
        } else if (callCount === 2) {
          // Context change callback
          expect(newDetails.value).toBe(BOOLEAN_VALUE);
          expect(oldDetails.value).toBe(BOOLEAN_VALUE);
          resolveDone();
        }
      });

      await OpenFeature.setContext(domain, { user: 'test' });
      await donePromise;
    });

    it('should pass correct old and new details immediately and on context change', async () => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;
      let resolveDone: () => void;
      const donePromise = new Promise<void>((resolve) => {
        resolveDone = resolve;
      });

      client.onBooleanChanged('test-flag', false, (newDetails, oldDetails) => {
        callCount++;
        expect(oldDetails.value).toBeDefined();
        expect(newDetails.value).toBeDefined();
        expect(oldDetails.flagKey).toBe('test-flag');
        expect(newDetails.flagKey).toBe('test-flag');

        if (callCount === 2) {
          resolveDone();
        }
      });

      await OpenFeature.setContext(domain, { user: 'test' });
      await donePromise;
    });

    it('should unsubscribe when unsubscribe function is called', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      const unsubscribe = client.onBooleanChanged('test-flag', false, () => {
        callCount++;
      });

      // Callback fires immediately (callCount = 1)
      OpenFeature.setContext(domain, { user: 'test1' });

      setTimeout(() => {
        // Callback fires on context change (callCount = 2)
        unsubscribe();
        OpenFeature.setContext(domain, { user: 'test2' });

        setTimeout(() => {
          // Should only be 2 (initial + one context change before unsubscribe)
          expect(callCount).toBe(2);
          done();
        }, 50);
      }, 50);
    });

    it('should support multiple subscribers to same flag', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount1 = 0;
      let callCount2 = 0;

      client.onBooleanChanged('test-flag', false, () => {
        callCount1++;
      });

      client.onBooleanChanged('test-flag', false, () => {
        callCount2++;
        // Both should have fired once initially, then once on context change
        if (callCount1 === 2 && callCount2 === 2) {
          done();
        }
      });

      OpenFeature.setContext(domain, { user: 'test' });
    });
  });

  describe('Client-level onStringChanged', () => {
    it('should fire callback immediately and when context changes', async () => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;
      let resolveDone: () => void;
      const donePromise = new Promise<void>((resolve) => {
        resolveDone = resolve;
      });

      client.onStringChanged('test-flag', 'default', (newDetails, oldDetails) => {
        callCount++;
        expect(newDetails.value).toBe(STRING_VALUE);
        expect(oldDetails.value).toBe(STRING_VALUE);
        expect(newDetails.flagKey).toBe('test-flag');
        if (callCount === 2) {
          resolveDone();
        }
      });

      await OpenFeature.setContext(domain, { user: 'test' });
      await donePromise;
    });
  });

  describe('Client-level onNumberChanged', () => {
    it('should fire callback immediately and when context changes', async () => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;
      let resolveDone: () => void;
      const donePromise = new Promise<void>((resolve) => {
        resolveDone = resolve;
      });

      client.onNumberChanged('test-flag', 0, (newDetails, oldDetails) => {
        callCount++;
        expect(newDetails.value).toBe(NUMBER_VALUE);
        expect(oldDetails.value).toBe(NUMBER_VALUE);
        expect(newDetails.flagKey).toBe('test-flag');
        if (callCount === 2) {
          resolveDone();
        }
      });

      await OpenFeature.setContext(domain, { user: 'test' });
      await donePromise;
    });
  });

  describe('Client-level onObjectChanged', () => {
    it('should fire callback immediately and when context changes', async () => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;
      let resolveDone: () => void;
      const donePromise = new Promise<void>((resolve) => {
        resolveDone = resolve;
      });

      client.onObjectChanged('test-flag', {}, (newDetails, oldDetails) => {
        callCount++;
        if (callCount === 1) {
          // Initial callback - both old and new are same initially
          expect(newDetails.value).toEqual(OBJECT_VALUE);
          expect(oldDetails.value).toEqual(OBJECT_VALUE);
        } else if (callCount === 2) {
          // Context change callback
          expect(newDetails.value).toEqual(OBJECT_VALUE);
          expect(oldDetails.value).toEqual(OBJECT_VALUE);
          expect(newDetails.flagKey).toBe('test-flag');
          resolveDone();
        }
      });

      await OpenFeature.setContext(domain, { user: 'test' });
      await donePromise;
    });
  });

  describe('ConfigurationChanged events', () => {
    it('should fire callback when configuration changes', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanChanged('test-flag', false, (newDetails) => {
        callCount++;
        if (callCount === 1) {
          // Initial callback
          expect(newDetails.value).toBe(BOOLEAN_VALUE);
        } else if (callCount === 2) {
          // Configuration change callback
          expect(newDetails.value).toBe(BOOLEAN_VALUE);
          done();
        }
      });

      // Emit a configuration changed event
      client.addHandler(ProviderEvents.ConfigurationChanged, () => {});
      // Trigger configuration changed via the internal emitter
      setTimeout(() => {
        // We need to trigger the event through the client's event system
        const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
        handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['test-flag'] }));
      }, 10);
    });

    it('should only fire callback when flagsChanged includes the subscribed flag', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanChanged('test-flag', false, () => {
        callCount++;
      });

      setTimeout(() => {
        // Trigger configuration changed for a different flag
        const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
        handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['other-flag'] }));

        setTimeout(() => {
          // Should only be 1 (initial callback only)
          expect(callCount).toBe(1);
          done();
        }, 50);
      }, 10);
    });

    it('should fire callback when flagsChanged is undefined (all flags may have changed)', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanChanged('test-flag', false, () => {
        callCount++;
        if (callCount === 2) {
          done();
        }
      });

      setTimeout(() => {
        // Trigger configuration changed without flagsChanged (undefined means all flags)
        const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
        handlers.forEach((handler) => handler({ providerName: 'mock' }));
      }, 10);
    });
  });

  describe('Subscription options', () => {
    it('should not fire on context change when updateOnContextChanged is false', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanChanged(
        'test-flag',
        false,
        () => {
          callCount++;
        },
        { updateOnContextChanged: false },
      );

      OpenFeature.setContext(domain, { user: 'test' });

      setTimeout(() => {
        // Should only be 1 (initial callback only, no context change callback)
        expect(callCount).toBe(1);
        done();
      }, 50);
    });

    it('should not fire on configuration change when updateOnConfigurationChanged is false', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanChanged(
        'test-flag',
        false,
        () => {
          callCount++;
        },
        { updateOnConfigurationChanged: false },
      );

      setTimeout(() => {
        // Trigger configuration changed
        const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
        handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['test-flag'] }));

        setTimeout(() => {
          // Should only be 1 (initial callback only, no configuration change callback)
          expect(callCount).toBe(1);
          done();
        }, 50);
      }, 10);
    });

    it('should only fire immediate callback when both options are false', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanChanged(
        'test-flag',
        false,
        () => {
          callCount++;
        },
        { updateOnContextChanged: false, updateOnConfigurationChanged: false },
      );

      OpenFeature.setContext(domain, { user: 'test' });

      setTimeout(() => {
        const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
        handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['test-flag'] }));

        setTimeout(() => {
          // Should only be 1 (initial callback only)
          expect(callCount).toBe(1);
          done();
        }, 50);
      }, 50);
    });

    it('should fire on both events when both options are true (default)', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanChanged('test-flag', false, () => {
        callCount++;
        if (callCount === 3) {
          // Initial + context change + configuration change
          done();
        }
      });

      OpenFeature.setContext(domain, { user: 'test' });

      setTimeout(() => {
        const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
        handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['test-flag'] }));
      }, 50);
    });
  });

  describe('Unsubscribe cleanup', () => {
    it('should remove both context and configuration handlers on unsubscribe', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      const unsubscribe = client.onBooleanChanged('test-flag', false, () => {
        callCount++;
      });

      // Initial callback fires (callCount = 1)
      unsubscribe();

      OpenFeature.setContext(domain, { user: 'test' });

      setTimeout(() => {
        const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
        handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['test-flag'] }));

        setTimeout(() => {
          // Should only be 1 (initial callback only, both handlers removed)
          expect(callCount).toBe(1);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('EvaluationDetails onChanged', () => {
    it('should fire callback when context changes', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        (
          details as {
            onChanged: (
              callback: (newDetails: EvaluationDetails<boolean>, oldDetails: EvaluationDetails<boolean>) => void,
            ) => () => void;
          }
        ).onChanged((newDetails, oldDetails) => {
          expect(newDetails.value).toBe(BOOLEAN_VALUE);
          expect(oldDetails.value).toBe(BOOLEAN_VALUE);
          expect(newDetails.flagKey).toBe('test-flag');
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should pass correct old and new details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        (
          details as {
            onChanged: (
              callback: (newDetails: EvaluationDetails<boolean>, oldDetails: EvaluationDetails<boolean>) => void,
            ) => () => void;
          }
        ).onChanged((newDetails, oldDetails) => {
          expect(oldDetails.flagKey).toBe('test-flag');
          expect(newDetails.flagKey).toBe('test-flag');
          expect(typeof oldDetails.value).toBe('boolean');
          expect(typeof newDetails.value).toBe('boolean');
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should unsubscribe when unsubscribe function is called', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);
      let callCount = 0;

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        const unsubscribe = details.onChanged(() => {
          callCount++;
        });

        OpenFeature.setContext(domain, { user: 'test1' });

        setTimeout(() => {
          unsubscribe();
          OpenFeature.setContext(domain, { user: 'test2' });

          setTimeout(() => {
            // Should only be 1 (one context change before unsubscribe)
            expect(callCount).toBe(1);
            done();
          }, 50);
        }, 50);
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should work with string details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getStringDetails('test-flag', 'default');

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        (
          details as {
            onChanged: (
              callback: (newDetails: EvaluationDetails<string>, oldDetails: EvaluationDetails<string>) => void,
            ) => () => void;
          }
        ).onChanged((newDetails) => {
          expect(newDetails.value).toBe(STRING_VALUE);
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should work with number details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getNumberDetails('test-flag', 0);

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        (
          details as {
            onChanged: (
              callback: (newDetails: EvaluationDetails<number>, oldDetails: EvaluationDetails<number>) => void,
            ) => () => void;
          }
        ).onChanged((newDetails) => {
          expect(newDetails.value).toBe(NUMBER_VALUE);
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should work with object details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getObjectDetails('test-flag', {});

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        (
          details as {
            onChanged: (
              callback: (newDetails: EvaluationDetails<JsonValue>, oldDetails: EvaluationDetails<JsonValue>) => void,
            ) => () => void;
          }
        ).onChanged((newDetails) => {
          expect(newDetails.value).toEqual(OBJECT_VALUE);
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should continue firing across multiple context changes', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);
      let callCount = 0;

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        details.onChanged(() => {
          callCount++;
          // Two context changes
          if (callCount === 2) {
            done();
          }
        });

        OpenFeature.setContext(domain, { user: 'test1' });

        setTimeout(() => {
          OpenFeature.setContext(domain, { user: 'test2' });
        }, 50);
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should fire callback on configuration change', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);
      let callCount = 0;

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        details.onChanged(() => {
          callCount++;
          if (callCount === 1) {
            done();
          }
        });

        setTimeout(() => {
          const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
          handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['test-flag'] }));
        }, 10);
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should respect updateOnContextChanged option', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);
      let callCount = 0;

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        details.onChanged(
          () => {
            callCount++;
          },
          { updateOnContextChanged: false },
        );

        OpenFeature.setContext(domain, { user: 'test' });

        setTimeout(() => {
          // Should be 0 (no context change callback)
          expect(callCount).toBe(0);
          done();
        }, 50);
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });

    it('should respect updateOnConfigurationChanged option', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);
      let callCount = 0;

      if ('onChanged' in details && typeof details.onChanged === 'function') {
        details.onChanged(
          () => {
            callCount++;
          },
          { updateOnConfigurationChanged: false },
        );

        setTimeout(() => {
          const handlers = client.getHandlers(ProviderEvents.ConfigurationChanged);
          handlers.forEach((handler) => handler({ providerName: 'mock', flagsChanged: ['test-flag'] }));

          setTimeout(() => {
            // Should be 0 (no configuration change callback)
            expect(callCount).toBe(0);
            done();
          }, 50);
        }, 10);
      } else {
        done(new Error('onChanged method not found on EvaluationDetails'));
      }
    });
  });
});
