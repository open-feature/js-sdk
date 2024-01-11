import { EventDetails } from '@openfeature/core';
import { v4 as uuid } from 'uuid';
import {
  JsonValue,
  NOOP_PROVIDER,
  OpenFeature,
  OpenFeatureEventEmitter,
  Provider,
  ProviderEvents,
  ProviderMetadata,
  ProviderStatus,
  ResolutionDetails,
  StaleEvent
} from '../src';

const TIMEOUT = 1000;
const ERR_MESSAGE = 'fake err';

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;
  readonly events?: OpenFeatureEventEmitter;
  readonly runsOn = 'client';
  private hasInitialize: boolean;
  private failOnInit: boolean;
  private failOnContextChange: boolean;
  private asyncDelay?: number;
  private enableEvents: boolean;
  status?: ProviderStatus = undefined;
  onContextChange?: () => Promise<void>;

  constructor(options?: {
    hasInitialize?: boolean;
    initialStatus?: ProviderStatus;
    asyncDelay?: number;
    enableEvents?: boolean;
    failOnInit?: boolean;
    noContextChanged?: boolean;
    failOnContextChange?: boolean;
    name?: string;
  }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
    this.hasInitialize = options?.hasInitialize ?? true;
    this.status = options?.initialStatus ?? ProviderStatus.NOT_READY;
    this.asyncDelay = options?.asyncDelay ?? 0;
    this.enableEvents = options?.enableEvents ?? true;
    this.failOnInit = options?.failOnInit ?? false;
    this.failOnContextChange = options?.failOnContextChange ?? false;
    if (!options?.noContextChanged) {
      this.onContextChange = this.changeHandler;
    }

    if (this.enableEvents) {
      this.events = new OpenFeatureEventEmitter();
    }

    if (this.hasInitialize) {
      this.initialize = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, this.asyncDelay));
        if (this.failOnInit) {
          throw new Error(ERR_MESSAGE);
        }

        this.status = ProviderStatus.READY;
      });
    }
  }

  initialize: jest.Mock<Promise<void>, []> | undefined;

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

  private changeHandler() {
    return new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        if (this.failOnContextChange) {
          reject(new Error(ERR_MESSAGE));
        } else {
          resolve();
        }
      }, this.asyncDelay),
    );
  }
}

describe('Events', () => {
  // set timeouts short for this suite.
  jest.setTimeout(TIMEOUT);
  let clientId = uuid();

  afterEach(async () => {
    await OpenFeature.clearProviders();
    OpenFeature.clearHandlers();
    jest.clearAllMocks();
    clientId = uuid();
    // hacky, but it's helpful to clear the handlers between tests
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (OpenFeature as any)._clientEventHandlers = new Map();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (OpenFeature as any)._clientEvents = new Map();
  });

  beforeEach(() => {
    OpenFeature.setProvider(NOOP_PROVIDER);
  });

  describe('Requirement 5.1.1', () => {
    describe('provider implements events', () => {
      it('The provider defines a mechanism for signalling the occurrence of an event`PROVIDER_READY`', (done) => {
        const provider = new MockProvider();
        const client = OpenFeature.getClient(clientId);
        client.addHandler(ProviderEvents.Ready, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            expect(provider.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });
        OpenFeature.setProvider(clientId, provider);
      });

      it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {
        //make sure an error event is fired when initialize promise reject
        const provider = new MockProvider({ failOnInit: true });
        const client = OpenFeature.getClient(clientId);

        client.addHandler(ProviderEvents.Error, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            expect(provider.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });

        OpenFeature.setProvider(clientId, provider);
      });
    });

    describe('provider does not implement events', () => {
      it('The provider defines a mechanism for signalling the occurrence of an event`PROVIDER_READY`', (done) => {
        const provider = new MockProvider({ enableEvents: false });
        const client = OpenFeature.getClient(clientId);

        client.addHandler(ProviderEvents.Ready, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            done();
          } catch (err) {
            done(err);
          }
        });

        OpenFeature.setProvider(clientId, provider);
      });

      it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {
        const provider = new MockProvider({ enableEvents: false, failOnInit: true });
        const client = OpenFeature.getClient(clientId);

        client.addHandler(ProviderEvents.Error, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            expect(provider.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });

        OpenFeature.setProvider(clientId, provider);
      });
    });
  });

  describe('Requirement 5.1.2', () => {
    it('When a provider signals the occurrence of a particular event, the associated client and API event handlers run', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      Promise.all([
        new Promise<void>((resolve) => {
          client.addHandler(ProviderEvents.Error, () => {
            resolve();
          });
        }),
        new Promise<void>((resolve) => {
          OpenFeature.addHandler(ProviderEvents.Error, () => {
            resolve();
          });
        }),
      ]).then(() => {
        done();
      });

      OpenFeature.setProvider(clientId, provider);
      provider.events?.emit(ProviderEvents.Error);
    });
  });

  describe('Requirement 5.1.3', () => {
    it('When a provider signals the occurrence of a particular event, event handlers on clients which are not associated with that provider do not run', (done) => {
      const provider = new MockProvider();
      const client0 = OpenFeature.getClient(clientId);
      const client1 = OpenFeature.getClient(clientId + '1');

      const client1Handler = jest.fn();
      const client0Handler = () => {
        expect(client1Handler).not.toHaveBeenCalled();
        done();
      };

      client0.addHandler(ProviderEvents.Ready, client0Handler);
      client1.addHandler(ProviderEvents.Ready, client1Handler);

      OpenFeature.setProvider(clientId, provider);
    });

    it('anonymous provider with anonymous client should run non-init events', (done) => {
      const defaultProvider = new MockProvider({
        failOnInit: false,
        initialStatus: ProviderStatus.NOT_READY,
        name: 'default',
      });

      // get a anon client
      const anonClient = OpenFeature.getClient();
      anonClient.addHandler(ProviderEvents.ConfigurationChanged, () => {
        done();
      });

      // set the default provider
      OpenFeature.setProvider(defaultProvider);

      // fire events
      defaultProvider.events?.emit(ProviderEvents.ConfigurationChanged);
    });

    it('anonymous provider with anonymous client should run init events', (done) => {
      const defaultProvider = new MockProvider({
        failOnInit: false,
        initialStatus: ProviderStatus.NOT_READY,
        name: 'default',
      });

      // get a anon client
      const anonClient = OpenFeature.getClient();
      anonClient.addHandler(ProviderEvents.Ready, () => {
        done();
      });

      // set the default provider
      OpenFeature.setProvider(defaultProvider);
    });

    it('anonymous provider with named client should run non-init events', (done) => {
      const defaultProvider = new MockProvider({
        failOnInit: false,
        initialStatus: ProviderStatus.NOT_READY,
        name: 'default',
      });
      const unboundName = 'some-new-unbound-name';

      // get a client using the default because it has not other mapping
      const unBoundClient = OpenFeature.getClient(unboundName);
      unBoundClient.addHandler(ProviderEvents.ConfigurationChanged, () => {
        done();
      });

      // set the default provider
      OpenFeature.setProvider(defaultProvider);

      // fire events
      defaultProvider.events?.emit(ProviderEvents.ConfigurationChanged);
    });

    it('anonymous provider with named client should run init events', (done) => {
      const defaultProvider = new MockProvider({
        failOnInit: false,
        initialStatus: ProviderStatus.NOT_READY,
        name: 'default',
      });
      const unboundName = 'some-other-unbound-name';

      // get a client using the default because it has not other mapping
      const unBoundClient = OpenFeature.getClient(unboundName);
      unBoundClient.addHandler(ProviderEvents.Ready, () => {
        done();
      });

      // set the default provider
      OpenFeature.setProvider(defaultProvider);
    });

    it('un-bound client event handlers still run after new provider set', (done) => {
      const defaultProvider = new MockProvider({ name: 'default' });
      const namedProvider = new MockProvider();
      const unboundName = 'unboundName';
      const boundName = 'boundName';

      // set the default provider
      OpenFeature.setProvider(defaultProvider);

      // get a client using the default because it has not other mapping
      const unBoundClient = OpenFeature.getClient(unboundName);
      unBoundClient.addHandler(ProviderEvents.ConfigurationChanged, () => {
        done();
      });

      // get a client and assign a provider to it
      OpenFeature.setProvider(boundName, namedProvider);
      OpenFeature.getClient(boundName);

      // fire events
      defaultProvider.events?.emit(ProviderEvents.ConfigurationChanged);
    });

    it('handler added while while provider initializing runs', (done) => {
      const provider = new MockProvider({
        name: 'race',
        initialStatus: ProviderStatus.NOT_READY,
        asyncDelay: TIMEOUT / 2,
      });

      // set the default provider
      OpenFeature.setProvider(provider);
      const client = OpenFeature.getClient();

      // add a handler while the provider is starting
      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });
    });

    it('PROVIDER_ERROR events populates the message field', (done) => {
      const provider = new MockProvider({ failOnInit: true });
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.Error, (details) => {
        expect(details?.message).toBeDefined();
        done();
      });

      OpenFeature.setProvider(clientId, provider);
    });
  });

  describe('Requirement 5.2.1,', () => {
    it('The client provides a function for associating handler functions with a particular provider event type', () => {
      const client = OpenFeature.getClient(clientId);
      expect(client.addHandler).toBeDefined();
    });
  });

  describe('Requirement 5.2.2,', () => {
    it('The API provides a function for associating handler functions with a particular provider event type', () => {
      expect(OpenFeature.addHandler).toBeDefined();
    });
  });

  describe('Requirement 5.2.3,', () => {
    it('The event details MUST contain the provider name associated with the event.', (done) => {
      const providerName = '5.2.3';
      const provider = new MockProvider({ name: providerName });
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.Ready, (details) => {
        expect(details?.providerName).toEqual(providerName);
        expect(details?.clientName).toEqual(clientId);
        done();
      });

      OpenFeature.setProvider(clientId, provider);
    });

    it('The event details contain the client name associated with the event in the client', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.Ready, (details) => {
        expect(details?.clientName).toEqual(clientId);
        done();
      });

      OpenFeature.setProvider(clientId, provider);
    });
  });

  describe('Requirement 5.2.4', () => {
    it('The handler function accepts a event details parameter.', (done) => {
      const details: StaleEvent = { message: 'message' };
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.Stale, (givenDetails) => {
        expect(givenDetails?.message).toEqual(details.message);
        done();
      });

      OpenFeature.setProvider(clientId, provider);
      provider.events?.emit(ProviderEvents.Stale, details);
    });
  });

  describe('Requirement 5.2.5', () => {
    it('If a handler function terminates abnormally, other handler functions run', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      const handler0 = jest.fn(() => {
        throw new Error('Error during initialization');
      });

      const handler1 = () => {
        expect(handler0).toHaveBeenCalled();
        done();
      };

      client.addHandler(ProviderEvents.Ready, handler0);
      client.addHandler(ProviderEvents.Ready, handler1);

      OpenFeature.setProvider(clientId, provider);
    });
  });

  describe('Requirement 5.2.6 ', () => {
    it('Event handlers MUST persist across `provider` changes.', (done) => {
      const provider1 = new MockProvider({ name: 'provider-1' });
      const provider2 = new MockProvider({ name: 'provider-2' });
      const client = OpenFeature.getClient(clientId);

      let counter = 0;
      client.addHandler(ProviderEvents.Ready, () => {
        if (client.metadata.providerMetadata.name === provider1.metadata.name) {
          OpenFeature.setProvider(clientId, provider2);
          counter++;
        } else {
          expect(counter).toBeGreaterThan(0);
          expect(client.metadata.providerMetadata.name).toBe(provider2.metadata.name);
          if (counter == 1) {
            done();
          }
        }
      });

      OpenFeature.setProvider(clientId, provider1);
    });
  });

  describe('Requirement 5.2.7 ', () => {
    it('The API provides a function allowing the removal of event handlers', () => {
      const handler = jest.fn();
      const eventType = ProviderEvents.Stale;

      OpenFeature.addHandler(eventType, handler);
      expect(OpenFeature.getHandlers(eventType)).toHaveLength(1);
      OpenFeature.removeHandler(eventType, handler);
      expect(OpenFeature.getHandlers(eventType)).toHaveLength(0);
    });

    it('The API provides a function allowing the removal of event handlers', () => {
      const client = OpenFeature.getClient(clientId);
      const handler = jest.fn();
      const eventType = ProviderEvents.Stale;

      client.addHandler(eventType, handler);
      expect(client.getHandlers(eventType)).toHaveLength(1);
      client.removeHandler(eventType, handler);
      expect(client.getHandlers(eventType)).toHaveLength(0);
    });
  });

  describe('Requirement 5.3.1', () => {
    it('If the provider `initialize` function terminates normally, `PROVIDER_READY` handlers MUST run', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });

      OpenFeature.setProvider(clientId, provider);
    });
  });

  describe('Requirement 5.3.2', () => {
    it('If the provider `initialize` function terminates abnormally, `PROVIDER_ERROR` handlers MUST run.', (done) => {
      const provider = new MockProvider({ failOnInit: true });
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.Error, () => {
        done();
      });

      OpenFeature.setProvider(clientId, provider);
    });

    it('It defines a mechanism for signalling `PROVIDER_CONFIGURATION_CHANGED`', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.ConfigurationChanged, () => {
        done();
      });

      OpenFeature.setProvider(clientId, provider);
      // emit a change event from the mock provider
      provider.events?.emit(ProviderEvents.ConfigurationChanged);
    });
  });

  describe('Requirement 5.3.3', () => {
    describe('API', () => {
      describe('Handlers attached after the provider is already in the associated state, MUST run immediately.', () => {
        it('Ready', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY });

          OpenFeature.setProvider(clientId, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          OpenFeature.addHandler(ProviderEvents.Ready, () => {
            done();
          });
        });

        it('Error', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.ERROR });

          OpenFeature.setProvider(clientId, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          OpenFeature.addHandler(ProviderEvents.Error, () => {
            done();
          });
        });

        it('Stale', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.STALE });

          OpenFeature.setProvider(clientId, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          OpenFeature.addHandler(ProviderEvents.Stale, () => {
            done();
          });
        });
      });
    });

    describe('client', () => {
      describe('Handlers attached after the provider is already in the associated state, MUST run immediately.', () => {
        it('Ready', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY });
          const client = OpenFeature.getClient(clientId);

          OpenFeature.setProvider(clientId, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          client.addHandler(ProviderEvents.Ready, () => {
            done();
          });
        });

        it('Error', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.ERROR });
          const client = OpenFeature.getClient(clientId);

          OpenFeature.setProvider(clientId, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          client.addHandler(ProviderEvents.Error, () => {
            done();
          });
        });

        it('Stale', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.STALE });
          const client = OpenFeature.getClient(clientId);

          OpenFeature.setProvider(clientId, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          client.addHandler(ProviderEvents.Stale, () => {
            done();
          });
        });
      });
    });
  });

  describe('Requirement 5.3.4.2, 5.3.4.3', () => {
    describe('API', () => {
      describe('context set for same client', () => {
        it("If the provider's `on context changed` function terminates normally, associated `PROVIDER_CONTEXT_CHANGED` handlers MUST run.", (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY });

          OpenFeature.setProvider(clientId, provider);
          OpenFeature.setContext(clientId, {});

          const handler = (details?: EventDetails) => {
            try {
              expect(details?.clientName).toEqual(clientId);
              expect(details?.providerName).toEqual(provider.metadata.name);
              done();
            } catch (e) {
              done(e);
            }
          };

          OpenFeature.addHandler(ProviderEvents.ContextChanged, handler);
        });

        it("If the provider's `on context changed` function terminates abnormally, associated `PROVIDER_ERROR` handlers MUST run.", (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY, failOnContextChange: true });

          OpenFeature.setProvider(clientId, provider);
          OpenFeature.setContext(clientId, {});

          const handler = (details?: EventDetails) => {
            try {
              expect(details?.clientName).toEqual(clientId);
              expect(details?.providerName).toEqual(provider.metadata.name);
              done();
            } catch (e) {
              done(e);
            }
          };

          OpenFeature.addHandler(ProviderEvents.Error, handler);
        });
      });

      describe('context set for different client', () => {
        it("If the provider's `on context changed` function terminates normally, associated `PROVIDER_CONTEXT_CHANGED` handlers MUST run.", (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY });
          let runCount = 0;

          OpenFeature.setProvider(clientId, provider);

          // expect 2 runs, since 2 providers are impacted by this context change (global)
          const handler = (details?: EventDetails) => {
            try {
              runCount++;
              // one run should be global
              if (details?.clientName === undefined) {
                expect(details?.providerName).toEqual(OpenFeature.getProviderMetadata().name);
              } else if (details?.clientName === clientId) {
                // one run should be for client
                expect(details?.clientName).toEqual(clientId);
                expect(details?.providerName).toEqual(provider.metadata.name);
              }
              if (runCount == 2) {
                done();
              }
            } catch (e) {
              done(e);
            }
          };

          OpenFeature.addHandler(ProviderEvents.ContextChanged, handler);
          OpenFeature.setContext({});

        });

        it("If the provider's `on context changed` function terminates abnormally, associated `PROVIDER_ERROR` handlers MUST run.", (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY, failOnContextChange: true });

          OpenFeature.setProvider(clientId, provider);

          const handler = (details?: EventDetails) => {
            try {
              // expect only one error run, because only one provider throws
              expect(details?.clientName).toEqual(clientId);
              expect(details?.providerName).toEqual(provider.metadata.name);
              expect(details?.message).toBeTruthy();
              done();
            } catch (e) {
              done(e);
            }
          };

          OpenFeature.addHandler(ProviderEvents.Error, handler);
          OpenFeature.setContext({});
        });
      });
    });

    describe('client', () => {
      it("If the provider's `on context changed` function terminates normally, associated `PROVIDER_CONTEXT_CHANGED` handlers MUST run.", (done) => {
        const provider = new MockProvider({ initialStatus: ProviderStatus.READY });
        const client = OpenFeature.getClient(clientId);

        OpenFeature.setProvider(clientId, provider);

        const handler = (details?: EventDetails) => {
          try {
            expect(details?.clientName).toEqual(clientId);
            expect(details?.providerName).toEqual(provider.metadata.name);
            done();
          } catch (e) {
            done(e);
          }
        };

        client.addHandler(ProviderEvents.ContextChanged, handler);
        OpenFeature.setContext(clientId, {});
      });

      it("If the provider's `on context changed` function terminates abnormally, associated `PROVIDER_ERROR` handlers MUST run.", (done) => {
        const provider = new MockProvider({ initialStatus: ProviderStatus.READY, failOnContextChange: true });
        const client = OpenFeature.getClient(clientId);

        OpenFeature.setProvider(clientId, provider);

        const handler = (details?: EventDetails) => {
          try {
            expect(details?.clientName).toEqual(clientId);
            expect(details?.providerName).toEqual(provider.metadata.name);
            expect(details?.message).toBeTruthy();
            done();
          } catch (e) {
            done(e);
          }
        };

        client.addHandler(ProviderEvents.Error, handler);
        OpenFeature.setContext(clientId, {});

      });
    });

    describe('provider', () => {
      describe('has no onContextChange handler', () => {
        it('runs API ContextChanged event handler', (done) => {
          const noChangeHandlerProvider = 'noChangeHandlerProvider';
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY, noContextChanged: true });
  
          OpenFeature.setProvider(noChangeHandlerProvider, provider);
          OpenFeature.setContext(noChangeHandlerProvider, {});
  
          const handler = (details?: EventDetails) => {
            try {
              expect(details?.clientName).toEqual(noChangeHandlerProvider);
              expect(details?.providerName).toEqual(provider.metadata.name);
              done();
            } catch (e) {
              done(e);
            }
          };
  
          OpenFeature.addHandler(ProviderEvents.ContextChanged, handler);
        });
      });
    });
  });
});
