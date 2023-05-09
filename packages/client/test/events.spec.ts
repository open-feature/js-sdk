import {
  Provider,
  ProviderEvents,
  OpenFeatureEventEmitter,
  OpenFeatureAPI,
} from '../src';

const ERROR_REASON = 'error';
const ERROR_CODE = 'MOCKED_ERROR';

const MOCK_EVENT_PROVIDER = {
  metadata: {
    name: 'mock-events',
  },
  initialize: jest.fn(() => {
    return Promise.resolve(undefined);
  }),
  events: new OpenFeatureEventEmitter(),
} as unknown as Provider;

const MOCK_ERROR_EVENT_PROVIDER = {
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

const MOCK_NO_EVENT_PROVIDER = {
  metadata: {
    name: 'mock-no-events',
  },
  initialize: jest.fn(() => {
    return Promise.resolve(undefined);
  }),
  // no events.
} as unknown as Provider;

const MOCK_ERROR_NO_EVENT_PROVIDER = {
  metadata: {
    name: 'mock-no-events-failure',
  },
  initialize: jest.fn(() => {
    return Promise.reject({
      reason: ERROR_REASON,
      errorCode: ERROR_CODE,
    });
  }),
  // no events.
} as unknown as Provider;

describe('Events', () => {
  // set timeouts short for this suite.
  jest.setTimeout(1000);
  let API: OpenFeatureAPI = new (OpenFeatureAPI as any)();

  afterEach(() => {
    jest.clearAllMocks();
    API = new (OpenFeatureAPI as any)(); //TODO this hacky thing should be removed with provider mapping: https://github.com/open-feature/js-sdk/issues/421
  });

  describe('Requirement 5.1.1', () => {
    describe('provider implements events', () => {
      it('The provider defines a mechanism for signalling the occurrence of an event`PROVIDER_READY`', (done) => {
        const client = API.getClient();
        client.addHandler(ProviderEvents.Ready, () => {
          try {
            expect(API.providerMetadata.name).toBe(MOCK_EVENT_PROVIDER.metadata.name);
            expect(MOCK_EVENT_PROVIDER.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });
        API.setProvider(MOCK_EVENT_PROVIDER);
      });
  
      it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {
        //make sure an error event is fired when initialize promise reject
        const client = API.getClient();
        client.addHandler(ProviderEvents.Error, () => {
          try {
            expect(API.providerMetadata.name).toBe(MOCK_ERROR_EVENT_PROVIDER.metadata.name);
            expect(MOCK_ERROR_EVENT_PROVIDER.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });
        API.setProvider(MOCK_ERROR_EVENT_PROVIDER);
      });
    });

    describe('provider does not implement events', () => {
      it('The provider defines a mechanism for signalling the occurrence of an event`PROVIDER_READY`', (done) => {
        const client = API.getClient();
        client.addHandler(ProviderEvents.Ready, () => {
          try {
            expect(API.providerMetadata.name).toBe(MOCK_NO_EVENT_PROVIDER.metadata.name);
            expect(MOCK_NO_EVENT_PROVIDER.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });
        API.setProvider(MOCK_NO_EVENT_PROVIDER);
      });
  
      it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {
        //make sure an error event is fired when initialize promise reject
        const client = API.getClient();
        client.addHandler(ProviderEvents.Error, () => {
          try {
            expect(API.providerMetadata.name).toBe(MOCK_ERROR_NO_EVENT_PROVIDER.metadata.name);
            expect(MOCK_ERROR_NO_EVENT_PROVIDER.initialize).toHaveBeenCalled();
            done();
          } catch (err) {
            done(err);
          }
        });
        API.setProvider(MOCK_ERROR_NO_EVENT_PROVIDER);
      });
    });
  });

  describe('Requirement 5.2.1, 5.2.3, 5.2.4, 5.2.5 ', () => {

    it('If the provider `initialize` function terminates normally, `PROVIDER_READY` handlers MUST run', (done) => {
      const client = API.getClient();
      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });
      API.setProvider(MOCK_EVENT_PROVIDER);
    });

    it('If the provider `initialize` function terminates abnormally, `PROVIDER_ERROR` handlers MUST run.', (done) => {
      const client = API.getClient();
      client.addHandler(ProviderEvents.Error, () => {
        done();
      });
      API.setProvider(MOCK_ERROR_EVENT_PROVIDER);
    });

    it('It defines a mechanism for signalling `PROVIDER_CONFIGURATION_CHANGED`', (done) => {
      const client = API.getClient();
      client.addHandler(ProviderEvents.ConfigurationChanged, () => {
        done();
      });
      API.setProvider(MOCK_EVENT_PROVIDER);
      // emit a change event from the mock provider
      MOCK_EVENT_PROVIDER.events?.emit(ProviderEvents.ConfigurationChanged);
    });

    it('`PROVIDER_READY` handlers added after the provider is already in a ready state MUST run immediately.', (done) => {
      const client = API.getClient();
      API.setProvider(MOCK_EVENT_PROVIDER);
      expect(MOCK_EVENT_PROVIDER.initialize).toHaveBeenCalled();
      client.addHandler(ProviderEvents.Ready, () => {
        done();
      });
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
          API.setProvider(MOCK_EVENT_PROVIDER);
          counter++;
        } else {
          expect(counter).toBeGreaterThan(0);
          expect(API.providerMetadata.name).toBe(MOCK_EVENT_PROVIDER.metadata.name);
          if (counter == 1) {
            done();
          }
        }
      });
    });
  });
});
