import {
  OpenFeature,
  ApiEvents,
  ProviderEvents,
  Provider,
} from '../src';
import EventEmitter from 'events';

const ERROR_REASON = 'error';
const ERROR_CODE = 'MOCKED_ERROR';

const MOCK_EMITTER: EventEmitter = {
  emit: jest.fn( () => {
    return true;
  }),
  initialize: jest.fn( () => {
    return MOCK_EMITTER;
  })
}as unknown as EventEmitter;

const MOCK_ERROR_EMITTER: EventEmitter = {
  emit: jest.fn( (event) => {
    if (event == ProviderEvents.Ready) {
      throw Error('Event error!');
    }
    return true;
  }),
  initialize: jest.fn( () => {
    return MOCK_EMITTER;
  })
}as unknown as EventEmitter;

const MOCK_PROVIDER: Provider = {
  metadata: {
    name: 'mock-events-success',
  },
  initialize: jest.fn(() =>  {
    return Promise.resolve(undefined);
  }),
  events: MOCK_EMITTER,
} as unknown as Provider;

const ERROR_PROVIDER: Provider = {
  metadata: {
    name: 'mock-events-failure',
  },
  initialize: jest.fn(() =>  {
    return Promise.resolve(undefined);
  }),
  events: MOCK_ERROR_EMITTER,
} as unknown as Provider;

describe('Events', () => {
  // set timeouts short for this suite.
  jest.setTimeout(1000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 5.1.1', () => {
    it('The provider **MAY** define a mechanism for signalling the occurrence of an event`PROVIDER_READY`',
       async () => {

         await OpenFeature.setProvider(MOCK_PROVIDER);
         expect(OpenFeature['_provider']).toBe(MOCK_PROVIDER);
         await expect(MOCK_PROVIDER.initialize).toHaveBeenCalled();
         expect(MOCK_PROVIDER.events?.emit).toHaveBeenCalledWith(ProviderEvents.Ready);

       });

    it('The provider **MAY** define a mechanism for signalling `PROVIDER_ERROR`',
        async () => {

          await OpenFeature.setProvider(ERROR_PROVIDER);
          expect(OpenFeature['_provider']).toBe(ERROR_PROVIDER);
          await expect(ERROR_PROVIDER.initialize).toHaveBeenCalled();
          expect(ERROR_PROVIDER.events?.emit).toHaveBeenCalledWith(ProviderEvents.Ready); // if emit fails
          expect(ERROR_PROVIDER.events?.emit).toHaveBeenCalledWith(ProviderEvents.Error); // emit an error event

        });

    it(' when the provider initialization fails (the initialize promise rejects) the ERROR event fires on a registered client',
        async () => {

          const errProvider = {
            metadata: {
              name: 'mock-events-success',
            },
            initialize: jest.fn(() => {
              return Promise.reject({
                reason: ERROR_REASON,
                errorCode: ERROR_CODE,
              });
            }),
            events: MOCK_EMITTER,
          } as unknown as Provider;

          OpenFeature['_apiEvents'] = {
            emit: jest.fn(() => {
              return true;
            }),
            initialize: jest.fn(() => {
              return this;
            })
          } as unknown as EventEmitter;


          await OpenFeature.setProvider(errProvider);
          expect(OpenFeature['_provider']).toBe(errProvider);

          expect(errProvider.initialize).toHaveBeenCalled();
          //expect(apiMockEmitter.emit).toHaveBeenCalledWith(ProviderEvents.Error); TODO figure out how to check client error event, apiEvents uses only CONFIGURATION_CHANGED

        });
    it('The provider **MAY** define a mechanism for signalling `PROVIDER_CONFIGURATION_CHANGED`',
       async () => {
         OpenFeature['_apiEvents'] = {
           emit: jest.fn( () => {
             return true;
           }),
           initialize: jest.fn( () => {
             return MOCK_EMITTER;
           })
         } as unknown as EventEmitter;

         await OpenFeature.setProvider(MOCK_PROVIDER);
         expect(OpenFeature['_provider']).toBe(MOCK_PROVIDER);
         await expect(MOCK_PROVIDER.initialize).toHaveBeenCalled();
         expect(OpenFeature['_apiEvents'].emit).toHaveBeenCalledWith(ApiEvents.ProviderChanged);

       });
  });
});


// ### 5.2. Event handlers

// Requirement 5.2.1

// > The `client` **MUST** provide an `addHandler` function for attaching callbacks to `provider events`,
// which accepts event type(s) and a function to run when the associated event(s) occur.


// ### Requirement 5.2.2

// > Event handlers **MUST** persist across `provider` changes.
//   Behavior of event handlers should be independent of the order of handler addition and provider configuration.
