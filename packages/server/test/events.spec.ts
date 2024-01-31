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

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;
  readonly events?: OpenFeatureEventEmitter;
  readonly runsOn = 'server';
  private hasInitialize: boolean;
  private failOnInit: boolean;
  private initDelay?: number;
  private enableEvents: boolean;
  status?: ProviderStatus = undefined;

  constructor(options?: {
    hasInitialize?: boolean;
    initialStatus?: ProviderStatus;
    initDelay?: number;
    enableEvents?: boolean;
    failOnInit?: boolean;
    name?: string;
  }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
    this.hasInitialize = options?.hasInitialize ?? true;
    this.status = options?.initialStatus ?? ProviderStatus.NOT_READY;
    this.initDelay = options?.initDelay ?? 0;
    this.enableEvents = options?.enableEvents ?? true;
    this.failOnInit = options?.failOnInit ?? false;

    if (this.enableEvents) {
      this.events = new OpenFeatureEventEmitter();
    }

    if (this.hasInitialize) {
      this.initialize = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, this.initDelay));
        if (this.failOnInit) {
          throw new Error('Provider initialization failed');
        }

        this.status = ProviderStatus.READY;
      });
    }
  }

  initialize: jest.Mock<Promise<void>, []> | undefined;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async onClose(): Promise<void> {}

  resolveBooleanEvaluation(): Promise<ResolutionDetails<boolean>> {
    throw new Error('Not implemented');
  }

  resolveNumberEvaluation(): Promise<ResolutionDetails<number>> {
    throw new Error('Not implemented');
  }

  resolveObjectEvaluation<T extends JsonValue>(): Promise<ResolutionDetails<T>> {
    throw new Error('Not implemented');
  }

  resolveStringEvaluation(): Promise<ResolutionDetails<string>> {
    throw new Error('Not implemented');
  }
}

describe('Events', () => {
  // set timeouts short for this suite.
  jest.setTimeout(TIMEOUT);
  let domain = uuid();

  afterEach(async () => {
    await OpenFeature.clearProviders();
    jest.clearAllMocks();
    domain = uuid();
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
        const client = OpenFeature.getClient(domain);
        client.addHandler(ProviderEvents.Ready, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            expect(provider.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });
        OpenFeature.setProvider(domain, provider);
      });

      it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {
        //make sure an error event is fired when initialize promise reject
        const provider = new MockProvider({ failOnInit: true });
        const client = OpenFeature.getClient(domain);

        client.addHandler(ProviderEvents.Error, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            expect(provider.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });

        OpenFeature.setProvider(domain, provider);
      });
    });

    describe('provider does not implement events', () => {
      it('The provider defines a mechanism for signalling the occurrence of an event`PROVIDER_READY`', (done) => {
        const provider = new MockProvider({ enableEvents: false });
        const client = OpenFeature.getClient(domain);

        client.addHandler(ProviderEvents.Ready, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            done();
          } catch (err) {
            done(err);
          }
        });

        OpenFeature.setProvider(domain, provider);
      });

      it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {
        const provider = new MockProvider({ enableEvents: false, failOnInit: true });
        const client = OpenFeature.getClient(domain);

        client.addHandler(ProviderEvents.Error, () => {
          try {
            expect(client.metadata.providerMetadata.name).toBe(provider.metadata.name);
            expect(provider.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });

        OpenFeature.setProvider(domain, provider);
      });
    });
  });

  describe('Requirement 5.1.2', () => {
    it('When a provider signals the occurrence of a particular event, the associated client and API event handlers run', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(domain);

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

      OpenFeature.setProvider(domain, provider);
      provider.events?.emit(ProviderEvents.Error);
    });
  });

  describe('Requirement 5.1.3', () => {
    it('When a provider signals the occurrence of a particular event, event handlers on clients which are not associated with that provider do not run', (done) => {
      const provider = new MockProvider();
      const client0 = OpenFeature.getClient(domain);
      const client1 = OpenFeature.getClient(domain + '1');

      const client1Handler = jest.fn();
      const client0Handler = () => {
        expect(client1Handler).not.toHaveBeenCalled();
        done();
      };

      client0.addHandler(ProviderEvents.Ready, client0Handler);
      client1.addHandler(ProviderEvents.Ready, client1Handler);

      OpenFeature.setProvider(domain, provider);
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
        initDelay: TIMEOUT / 2,
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
      const client = OpenFeature.getClient(domain);

      client.addHandler(ProviderEvents.Error, (details) => {
        expect(details?.message).toBeDefined();
        done();
      });

      OpenFeature.setProvider(domain, provider);
    });
  });

  describe('Requirement 5.2.1,', () => {
    it('The client provides a function for associating handler functions with a particular provider event type', () => {
      const client = OpenFeature.getClient(domain);
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
      const client = OpenFeature.getClient(domain);

      client.addHandler(ProviderEvents.Ready, (details) => {
        expect(details?.providerName).toEqual(providerName);
        expect(details?.clientName).toEqual(domain);
        expect(details?.domain).toEqual(domain);
        done();
      });

      OpenFeature.setProvider(domain, provider);
    });

    it('The event details contain the client name associated with the event in the client', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(domain);

      client.addHandler(ProviderEvents.Ready, (details) => {
        expect(details?.clientName).toEqual(domain);
        expect(details?.domain).toEqual(domain);
        done();
      });

      OpenFeature.setProvider(domain, provider);
    });
  });

  describe('Requirement 5.2.4', () => {
    it('The handler function accepts a event details parameter.', (done) => {
      const details: StaleEvent = { message: 'message' };
      const provider = new MockProvider();
      const client = OpenFeature.getClient(domain);

      client.addHandler(ProviderEvents.Stale, (givenDetails) => {
        expect(givenDetails?.message).toEqual(details.message);
        done();
      });

      OpenFeature.setProvider(domain, provider);
      provider.events?.emit(ProviderEvents.Stale, details);
    });
  });

  describe('Requirement 5.2.5', () => {
    it('If a handler function terminates abnormally, other handler functions run', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(domain);

      const handler0 = jest.fn(() => {
        throw new Error('Error during initialization');
      });

      const handler1 = () => {
        expect(handler0).toHaveBeenCalled();
        done();
      };

      client.addHandler(ProviderEvents.Ready, handler0);
      client.addHandler(ProviderEvents.Ready, handler1);

      OpenFeature.setProvider(domain, provider);
    });
  });

  describe('Requirement 5.2.6 ', () => {
    it('Event handlers MUST persist across `provider` changes.', (done) => {
      const provider1 = new MockProvider({ name: 'provider-1' });
      const provider2 = new MockProvider({ name: 'provider-2' });
      const client = OpenFeature.getClient(domain);

      let counter = 0;
      client.addHandler(ProviderEvents.Ready, () => {
        if (client.metadata.providerMetadata.name === provider1.metadata.name) {
          OpenFeature.setProvider(domain, provider2);
          counter++;
        } else {
          expect(counter).toBeGreaterThan(0);
          expect(client.metadata.providerMetadata.name).toBe(provider2.metadata.name);
          if (counter == 1) {
            done();
          }
        }
      });

      OpenFeature.setProvider(domain, provider1);
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
      const client = OpenFeature.getClient(domain);
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
      const client = OpenFeature.getClient(domain);

      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });

      OpenFeature.setProvider(domain, provider);
    });
  });

  describe('Requirement 5.3.2', () => {
    it('If the provider `initialize` function terminates abnormally, `PROVIDER_ERROR` handlers MUST run.', (done) => {
      const provider = new MockProvider({ failOnInit: true });
      const client = OpenFeature.getClient(domain);

      client.addHandler(ProviderEvents.Error, () => {
        done();
      });

      OpenFeature.setProvider(domain, provider);
    });

    it('It defines a mechanism for signalling `PROVIDER_CONFIGURATION_CHANGED`', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(domain);

      client.addHandler(ProviderEvents.ConfigurationChanged, () => {
        done();
      });

      OpenFeature.setProvider(domain, provider);
      // emit a change event from the mock provider
      provider.events?.emit(ProviderEvents.ConfigurationChanged);
    });
  });

  describe('Requirement 5.3.3', () => {
    describe('API', () => {
      describe('Handlers attached after the provider is already in the associated state, MUST run immediately.', () => {
        it('Ready', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.READY });

          OpenFeature.setProvider(domain, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          OpenFeature.addHandler(ProviderEvents.Ready, () => {
            done();
          });
        });

        it('Error', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.ERROR });

          OpenFeature.setProvider(domain, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          OpenFeature.addHandler(ProviderEvents.Error, () => {
            done();
          });
        });

        it('Stale', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.STALE });

          OpenFeature.setProvider(domain, provider);
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
          const client = OpenFeature.getClient(domain);

          OpenFeature.setProvider(domain, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          client.addHandler(ProviderEvents.Ready, () => {
            done();
          });
        });

        it('Error', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.ERROR });
          const client = OpenFeature.getClient(domain);

          OpenFeature.setProvider(domain, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          client.addHandler(ProviderEvents.Error, () => {
            done();
          });
        });

        it('Stale', (done) => {
          const provider = new MockProvider({ initialStatus: ProviderStatus.STALE });
          const client = OpenFeature.getClient(domain);

          OpenFeature.setProvider(domain, provider);
          expect(provider.initialize).not.toHaveBeenCalled();

          client.addHandler(ProviderEvents.Stale, () => {
            done();
          });
        });
      });
    });
  });
});
