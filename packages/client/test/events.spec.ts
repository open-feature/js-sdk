import {
  ApiEvents,
  Provider,
  ProviderEvents,
  OpenFeatureEventEmitter,
  OpenFeatureAPI,
} from '../src';

const ERROR_REASON = 'error';
const ERROR_CODE = 'MOCKED_ERROR';

const MOCK_PROVIDER = {
  metadata: {
    name: 'mock-events',
  },
  initialize: jest.fn(() => {
    return Promise.resolve(undefined);
  }),
  events: new OpenFeatureEventEmitter(),
} as unknown as Provider;

const ERROR_MOCK_PROVIDER = {
  metadata: {
    name: 'mock-events-failure',
  },
  initialize: jest.fn(() => {
    return Promise.reject({
      reason: ERROR_REASON,
      errorCode: ERROR_CODE,
    });
  }),
  events: new OpenFeatureEventEmitter(),
} as unknown as Provider;



describe('Events', () => {
  // set timeouts short for this suite.
  jest.setTimeout(1000);
  let API = new (OpenFeatureAPI as any)();

  afterEach(() => {
    jest.clearAllMocks();
    API = new (OpenFeatureAPI as any)();
  });

  describe('Requirement 5.1.1, 5.1.3', () => {
    it('The provider defines a mechanism for signalling the occurrence of an event`PROVIDER_READY`', (done) => {
      const myProvider: Provider = {
        metadata: {
          name: 'mock-events',
        },
        initialize: jest.fn(() => {
          return Promise.resolve(undefined);
        }),
        events: new OpenFeatureEventEmitter(),
      } as unknown as Provider;

      myProvider.events?.addListener(ProviderEvents.Ready, () => {
        try {
          expect(API.providerMetadata.name).toBe('mock-events');
          expect(myProvider.initialize).toHaveBeenCalled();
          done();
        } catch (err) {
          done(err);
        }
      });
      API.setProvider(myProvider);
    });

    it('It defines a mechanism for signalling `PROVIDER_CONFIGURATION_CHANGED`', (done) => {
      API['_apiEvents'] = new OpenFeatureEventEmitter();
      const myProvider: Provider = {
        metadata: {
          name: 'mock-events',
        },
        initialize: jest.fn(() => {
          return Promise.resolve(undefined);
        }),
        events: new OpenFeatureEventEmitter(),
      } as unknown as Provider;
      API['_apiEvents'].addListener(ApiEvents.ProviderChanged, () => {
        try {
          expect(API.providerMetadata.name).toBe('mock-events');
          done();
        } catch (err) {
          done(err);
        }
      });
      API.setProvider(myProvider);

    });

    it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {
      //make sure an error event is fired when initialize promise reject
      ERROR_MOCK_PROVIDER.events?.addListener(ProviderEvents.Error, () => {
        try {
          expect(API.providerMetadata.name).toBe('mock-events-failure');
          expect(ERROR_MOCK_PROVIDER.initialize).toHaveBeenCalled();
          done();
        } catch (err) {
          done(err);
        }
      });
      API.setProvider(ERROR_MOCK_PROVIDER);
    });

  });

  describe('Requirement 5.2.1, 5.2.3, 5.2.4, 5.2.5 ', () => {
    it('The `client` MUST provide an `addHandler` function for attaching callbacks to `provider events`, which accepts event type(s) and a `event handler function`.', (done) => {
      const client = API.getClient();
      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });
      API.setProvider(MOCK_PROVIDER);
    });

    it('If the provider `initialize` function terminates normally, `PROVIDER_READY` handlers MUST run', (done) => {
      const client = API.getClient();
      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });
      API.setProvider(MOCK_PROVIDER);
    });

    it('If the provider `initialize` function terminates abnormally, `PROVIDER_ERROR` handlers MUST run.', (done) => {
      const client = API.getClient();
      client.addHandler(ProviderEvents.Error, () => {
        done();
      });
      API.setProvider(ERROR_MOCK_PROVIDER);
    });

    it('`PROVIDER_READY` handlers added after the provider is already in a ready state MUST run immediately.', (done) => {
      const client = API.getClient();

      MOCK_PROVIDER.events?.addListener(ProviderEvents.Ready, () => {
        try {
          expect(MOCK_PROVIDER.initialize).toHaveBeenCalled();
          jest.setTimeout(10);
          let count = 0;
          client.addHandler(ProviderEvents.Ready, () => {
            if (count == 0) {
              count++;
              done();
            }
          });
        } catch (err) {
          done(err);
        }
      });

      API.setProvider(MOCK_PROVIDER);
    });
  });

  describe('Requirement 5.2.6 ', () => {
    it('Event handlers MUST persist across `provider` changes.', (done) => {
      const client = API.getClient();

      const myProvider: Provider = {
        metadata: {
          name: 'first',
        },
        initialize: jest.fn(() => {
          return Promise.resolve(undefined);
        }),
        events: new OpenFeatureEventEmitter(),
      } as unknown as Provider;

      API.setProvider(myProvider);
      let counter = 0;
      client.addHandler(ProviderEvents.Ready, () => {
        if (API.providerMetadata.name == myProvider.metadata.name) {
          API.setProvider(MOCK_PROVIDER);
          counter++;
        } else {
          expect(counter).toBeGreaterThan(0);
          expect(API.providerMetadata.name).toBe(MOCK_PROVIDER.metadata.name);
          if (counter == 1) {
            done();
          }
        }
      });
    });
  });
});
