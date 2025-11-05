import { v4 as uuid } from 'uuid';
import type { Provider, ResolutionDetails, JsonValue, EvaluationDetails } from '../src';
import { OpenFeature } from '../src';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 10;
const OBJECT_VALUE: JsonValue = { key: 'value' };

const REASON = 'mocked-value';

const MOCK_PROVIDER: Provider = {
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
};

describe('Context Change Subscriptions', () => {
  let domain: string;

  beforeEach(() => {
    domain = uuid();
    OpenFeature.setProvider(domain, MOCK_PROVIDER);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await OpenFeature.clearProviders();
    OpenFeature.clearHandlers();
    jest.clearAllMocks();
  });

  describe('Client-level onBooleanContextChanged', () => {
    it('should fire callback when context changes', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      client.onBooleanContextChanged('test-flag', false, (newDetails, oldDetails) => {
        callCount++;
        if (callCount === 1) {
          expect(newDetails.value).toBe(BOOLEAN_VALUE);
          expect(oldDetails.value).toBe(BOOLEAN_VALUE);
          expect(newDetails.flagKey).toBe('test-flag');
          expect(oldDetails.flagKey).toBe('test-flag');
          done();
        }
      });

      OpenFeature.setContext(domain, { user: 'test' });
    });

    it('should pass correct old and new details on context change', (done) => {
      const client = OpenFeature.getClient(domain);

      client.onBooleanContextChanged('test-flag', false, (newDetails, oldDetails) => {
        expect(oldDetails.value).toBeDefined();
        expect(newDetails.value).toBeDefined();
        expect(oldDetails.flagKey).toBe('test-flag');
        expect(newDetails.flagKey).toBe('test-flag');
        done();
      });

      OpenFeature.setContext(domain, { user: 'test' });
    });

    it('should unsubscribe when unsubscribe function is called', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount = 0;

      const unsubscribe = client.onBooleanContextChanged('test-flag', false, () => {
        callCount++;
      });

      OpenFeature.setContext(domain, { user: 'test1' });

      setTimeout(() => {
        unsubscribe();
        OpenFeature.setContext(domain, { user: 'test2' });

        setTimeout(() => {
          expect(callCount).toBe(1);
          done();
        }, 50);
      }, 50);
    });

    it('should support multiple subscribers to same flag', (done) => {
      const client = OpenFeature.getClient(domain);
      let callCount1 = 0;
      let callCount2 = 0;

      client.onBooleanContextChanged('test-flag', false, () => {
        callCount1++;
      });

      client.onBooleanContextChanged('test-flag', false, () => {
        callCount2++;
        if (callCount1 === 1 && callCount2 === 1) {
          done();
        }
      });

      OpenFeature.setContext(domain, { user: 'test' });
    });
  });

  describe('Client-level onStringContextChanged', () => {
    it('should fire callback when context changes', (done) => {
      const client = OpenFeature.getClient(domain);

      client.onStringContextChanged('test-flag', 'default', (newDetails, oldDetails) => {
        expect(newDetails.value).toBe(STRING_VALUE);
        expect(oldDetails.value).toBe(STRING_VALUE);
        expect(newDetails.flagKey).toBe('test-flag');
        done();
      });

      OpenFeature.setContext(domain, { user: 'test' });
    });
  });

  describe('Client-level onNumberContextChanged', () => {
    it('should fire callback when context changes', (done) => {
      const client = OpenFeature.getClient(domain);

      client.onNumberContextChanged('test-flag', 0, (newDetails, oldDetails) => {
        expect(newDetails.value).toBe(NUMBER_VALUE);
        expect(oldDetails.value).toBe(NUMBER_VALUE);
        expect(newDetails.flagKey).toBe('test-flag');
        done();
      });

      OpenFeature.setContext(domain, { user: 'test' });
    });
  });

  describe('Client-level onObjectContextChanged', () => {
    it('should fire callback when context changes', (done) => {
      const client = OpenFeature.getClient(domain);

      client.onObjectContextChanged('test-flag', {}, (newDetails, oldDetails) => {
        expect(newDetails.value).toEqual(OBJECT_VALUE);
        expect(oldDetails.value).toEqual({});
        expect(newDetails.flagKey).toBe('test-flag');
        done();
      });

      OpenFeature.setContext(domain, { user: 'test' });
    });
  });

  describe('EvaluationDetails onContextChanged', () => {
    it('should fire callback when context changes', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);

      if ('onContextChanged' in details && typeof details.onContextChanged === 'function') {
        (
          details as {
            onContextChanged: (
              callback: (newDetails: EvaluationDetails<boolean>, oldDetails: EvaluationDetails<boolean>) => void,
            ) => () => void;
          }
        ).onContextChanged((newDetails, oldDetails) => {
          expect(newDetails.value).toBe(BOOLEAN_VALUE);
          expect(oldDetails.value).toBe(BOOLEAN_VALUE);
          expect(newDetails.flagKey).toBe('test-flag');
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onContextChanged method not found on EvaluationDetails'));
      }
    });

    it('should pass correct old and new details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);

      if ('onContextChanged' in details && typeof details.onContextChanged === 'function') {
        (
          details as {
            onContextChanged: (
              callback: (newDetails: EvaluationDetails<boolean>, oldDetails: EvaluationDetails<boolean>) => void,
            ) => () => void;
          }
        ).onContextChanged((newDetails, oldDetails) => {
          expect(oldDetails.flagKey).toBe('test-flag');
          expect(newDetails.flagKey).toBe('test-flag');
          expect(typeof oldDetails.value).toBe('boolean');
          expect(typeof newDetails.value).toBe('boolean');
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onContextChanged method not found on EvaluationDetails'));
      }
    });

    it('should unsubscribe when unsubscribe function is called', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);
      let callCount = 0;

      if ('onContextChanged' in details && typeof details.onContextChanged === 'function') {
        const unsubscribe = details.onContextChanged(() => {
          callCount++;
        });

        OpenFeature.setContext(domain, { user: 'test1' });

        setTimeout(() => {
          unsubscribe();
          OpenFeature.setContext(domain, { user: 'test2' });

          setTimeout(() => {
            expect(callCount).toBe(1);
            done();
          }, 50);
        }, 50);
      } else {
        done(new Error('onContextChanged method not found on EvaluationDetails'));
      }
    });

    it('should work with string details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getStringDetails('test-flag', 'default');

      if ('onContextChanged' in details && typeof details.onContextChanged === 'function') {
        (
          details as {
            onContextChanged: (
              callback: (newDetails: EvaluationDetails<string>, oldDetails: EvaluationDetails<string>) => void,
            ) => () => void;
          }
        ).onContextChanged((newDetails) => {
          expect(newDetails.value).toBe(STRING_VALUE);
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onContextChanged method not found on EvaluationDetails'));
      }
    });

    it('should work with number details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getNumberDetails('test-flag', 0);

      if ('onContextChanged' in details && typeof details.onContextChanged === 'function') {
        (
          details as {
            onContextChanged: (
              callback: (newDetails: EvaluationDetails<number>, oldDetails: EvaluationDetails<number>) => void,
            ) => () => void;
          }
        ).onContextChanged((newDetails) => {
          expect(newDetails.value).toBe(NUMBER_VALUE);
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onContextChanged method not found on EvaluationDetails'));
      }
    });

    it('should work with object details', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getObjectDetails('test-flag', {});

      if ('onContextChanged' in details && typeof details.onContextChanged === 'function') {
        (
          details as {
            onContextChanged: (
              callback: (newDetails: EvaluationDetails<JsonValue>, oldDetails: EvaluationDetails<JsonValue>) => void,
            ) => () => void;
          }
        ).onContextChanged((newDetails) => {
          expect(newDetails.value).toEqual(OBJECT_VALUE);
          done();
        });

        OpenFeature.setContext(domain, { user: 'test' });
      } else {
        done(new Error('onContextChanged method not found on EvaluationDetails'));
      }
    });

    it('should continue firing across multiple context changes', (done) => {
      const client = OpenFeature.getClient(domain);
      const details = client.getBooleanDetails('test-flag', false);
      let callCount = 0;

      if ('onContextChanged' in details && typeof details.onContextChanged === 'function') {
        details.onContextChanged(() => {
          callCount++;
          if (callCount === 2) {
            done();
          }
        });

        OpenFeature.setContext(domain, { user: 'test1' });

        setTimeout(() => {
          OpenFeature.setContext(domain, { user: 'test2' });
        }, 50);
      } else {
        done(new Error('onContextChanged method not found on EvaluationDetails'));
      }
    });
  });
});
