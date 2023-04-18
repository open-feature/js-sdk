import {
  ProviderEvents,
  Provider,
  ResolutionDetails,
  Client,
  FlagValueType,
  EvaluationContext,
  OpenFeatureEventEmitter
} from '../src';
import {OpenFeature} from '../src/open-feature';
import EventEmitter from 'events';

const BOOLEAN_VALUE = true;
const BOOLEAN_VARIANT = `${BOOLEAN_VALUE}`;
const REASON = 'mocked-value';

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
    it('The provider **MAY** define a mechanism for signalling the occurrence of one of a set of events, \n' +
      '//   including `PROVIDER_READY`, `PROVIDER_ERROR`, `PROVIDER_CONFIGURATION_CHANGED` and `PROVIDER_SHUTDOWN`.',
       async () => {

         await OpenFeature.setProvider(MOCK_PROVIDER);
         expect(OpenFeature['_provider']).toBe(MOCK_PROVIDER);
         await expect(MOCK_PROVIDER.initialize).toHaveBeenCalled();
         expect(MOCK_PROVIDER.events?.emit).toHaveBeenCalledWith(ProviderEvents.Ready);

       });

    it('The provider **MAY** define a mechanism for signalling `PROVIDER_ERROR`',
        () => {

         OpenFeature.setProvider(ERROR_PROVIDER);
         expect(OpenFeature['_provider']).toBe(ERROR_PROVIDER);
         expect(ERROR_PROVIDER.initialize).toHaveBeenCalled();
         expect(ERROR_PROVIDER.events?.emit).toHaveBeenCalledWith(ProviderEvents.Ready);
         expect(ERROR_PROVIDER.events?.emit).toHaveBeenCalledWith(ProviderEvents.Error);

       });
    // it('The provider **MAY** define a mechanism for signalling `PROVIDER_CONFIGURATION_CHANGED`',
    //    async () => {
    //      await OpenFeature.setProvider(MOCK_PROVIDER);
    //      expect(OpenFeature['_provider']).toBe(MOCK_PROVIDER);
    //      await expect(MOCK_PROVIDER.initialize).toHaveBeenCalled();
    //      expect(OpenFeature['_apiEvents'].emit).toHaveBeenCalledWith(ProviderEvents.ConfigurationChanged);
    //
    //
    //    });
  });
});


// ### 5.2. Event handlers

// Requirement 5.2.1

// > The `client` **MUST** provide an `addHandler` function for attaching callbacks to `provider events`,
// which accepts event type(s) and a function to run when the associated event(s) occur.


// ### Requirement 5.2.2

// > Event handlers **MUST** persist across `provider` changes.
//   Behavior of event handlers should be independent of the order of handler addition and provider configuration.
