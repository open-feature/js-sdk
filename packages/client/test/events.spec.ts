import { addListener, nextTick } from 'process';
import { ApiEvents, OpenFeature, Provider, ProviderEvents, OpenFeatureEventEmitter } from '../src';


const ERROR_REASON = 'error';
const ERROR_CODE = 'MOCKED_ERROR';


describe('Events', () => {
  // set timeouts short for this suite.
  jest.setTimeout(1000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 5.1.1', () => {
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
          expect(OpenFeature.providerMetadata.name).toBe('mock-events');
          expect(myProvider.initialize).toHaveBeenCalled();
          done();
        } catch (err) {
          done(err);
        }
      });
      OpenFeature.setProvider(myProvider);
    });

    it('It defines a mechanism for signalling `PROVIDER_ERROR`', (done) => {

      const errProvider = {
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
      //make sure an error event is fired when initialize promise reject
      errProvider.events?.addListener(ProviderEvents.Error, () => {
        try {
          expect(OpenFeature.providerMetadata.name).toBe('mock-events-failure');
          expect(errProvider.initialize).toHaveBeenCalled();
          done();
        } catch (err) {
          done(err);
        }
      });
      OpenFeature.setProvider(errProvider);
    });

    it('It defines a mechanism for signalling `PROVIDER_CONFIGURATION_CHANGED`', (done) => {
      OpenFeature['_apiEvents'] = new OpenFeatureEventEmitter();
      const myProvider: Provider = {
        metadata: {
          name: 'mock-events',
        },
        initialize: jest.fn(() => {
          return Promise.resolve(undefined);
        }),
        events: new OpenFeatureEventEmitter(),
      } as unknown as Provider;

      OpenFeature['_apiEvents'].addListener(ApiEvents.ProviderChanged, () => {
        try {
          expect(OpenFeature.providerMetadata.name).toBe('mock-events');
          expect(myProvider.initialize).toHaveBeenCalled();
          done();
        } catch (err) {
          done(err);
        }
      });
      OpenFeature.setProvider(myProvider);
    });
  });

});


