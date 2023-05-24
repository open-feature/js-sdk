import {
  Provider,
  ProviderEvents,
  OpenFeatureEventEmitter,
  ProviderMetadata,
  ProviderStatus,
  ResolutionDetails,
  JsonValue,
  OpenFeature,
} from '../src';
import { v4 as uuid } from 'uuid';

const ERROR_REASON = 'error';
const ERROR_CODE = 'MOCKED_ERROR';

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;
  readonly events?: OpenFeatureEventEmitter;
  private hasInitialize: boolean;
  private failOnInit: boolean;
  private enableEvents: boolean;
  status?: ProviderStatus = undefined;

  constructor(options?: {
    hasInitialize?: boolean;
    initialStatus?: ProviderStatus;
    enableEvents?: boolean;
    failOnInit?: boolean;
    name?: string;
  }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
    this.hasInitialize = options?.hasInitialize ?? true;
    this.status = options?.initialStatus ?? ProviderStatus.NOT_READY;
    this.enableEvents = options?.enableEvents ?? true;
    this.failOnInit = options?.failOnInit ?? false;

    if (this.enableEvents) {
      this.events = new OpenFeatureEventEmitter();
    }

    if (this.hasInitialize) {
      this.initialize = jest.fn(async () => {
        if (this.failOnInit) {
          throw {
            reason: ERROR_REASON,
            errorCode: ERROR_CODE,
          };
        }

        this.status = ProviderStatus.READY;
      });
    }
  }

  initialize: jest.Mock<Promise<void>, []> | undefined;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async onClose(): Promise<void> {}

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

describe('Events', () => {
  // set timeouts short for this suite.
  jest.setTimeout(1000);
  let clientId = uuid();

  afterEach(() => {
    jest.clearAllMocks();
    clientId = uuid();
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

  describe('Requirement 5.2.1, 5.2.3, 5.2.4, 5.2.5 ', () => {
    it('If the provider `initialize` function terminates normally, `PROVIDER_READY` handlers MUST run', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });

      OpenFeature.setProvider(clientId, provider);
    });

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

    it('`PROVIDER_READY` handlers added after the provider is already in a ready state MUST run immediately.', (done) => {
      const provider = new MockProvider();
      const client = OpenFeature.getClient(clientId);

      OpenFeature.setProvider(clientId, provider);
      expect(provider.initialize).toHaveBeenCalled();

      let handlerCalled = false;
      client.addHandler(ProviderEvents.Ready, () => {
        if (!handlerCalled) {
          handlerCalled = true;
          done();
        }
      });
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
          console.log(counter);
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
});
