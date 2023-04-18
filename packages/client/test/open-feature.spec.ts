import {OpenFeatureClient} from '../src/client';
import {OpenFeature, OpenFeatureAPI} from '../src/open-feature';
import {Provider,} from '../src/types';

const MOCK_PROVIDER: Provider = {
  metadata: {
    name: 'mock-events-success',
  },
  initialize: jest.fn(() => {
    return Promise.resolve('started');
  }),
  onClose: jest.fn(() => {
    return Promise.resolve('closed');
  }),
} as unknown as Provider;

describe('OpenFeature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.1.1', () => {
    it('OpenFeatureAPI should be a singleton', () => {
      expect(OpenFeature === OpenFeatureAPI.getInstance()).toBeTruthy();
    });
  });

  describe('Requirement 1.1.2', () => {
    it('should equal previously set provider', () => {
      const fakeProvider = {metadata: 'test'} as unknown as Provider;
      OpenFeature.setProvider(fakeProvider);
      expect(OpenFeature.providerMetadata === fakeProvider.metadata).toBeTruthy();
    });

    describe('Requirement 1.1.2.2', () => {
      it('MUST invoke the `initialize` function on the newly registered provider before using it to resolve flag values', () => {
        OpenFeature.setProvider(MOCK_PROVIDER);
        expect(OpenFeature['_provider']).toBe(MOCK_PROVIDER);
        expect(MOCK_PROVIDER.initialize).toHaveBeenCalled();
      });
    });
    describe('Requirement 1.1.2.3', () => {
      it('MUST invoke the `shutdown` function on the previously registered provider once it\'s no longer being used to resolve flag values.', () => {
        const fakeProvider = {metadata: 'test'} as unknown as Provider;
        OpenFeature.setProvider(MOCK_PROVIDER);
        OpenFeature.setProvider(fakeProvider);
        expect(MOCK_PROVIDER.onClose).toHaveBeenCalled();
      });
    });


  });

  describe('Requirement 1.1.3', () => {
    it('should allow addition of hooks', () => {
      expect(OpenFeature.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.1.4', () => {
    it('should implement a provider metadata accessor and mutator', () => {
      expect(OpenFeature.providerMetadata).toBeDefined();
    });
  });

  describe('Requirement 1.1.5', () => {
    it('should implement a client factory', () => {
      expect(OpenFeature.getClient).toBeDefined();
      expect(OpenFeature.getClient()).toBeInstanceOf(OpenFeatureClient);

      const name = 'my-client';
      const namedClient = OpenFeature.getClient(name);

      // check that using a named configuration also works as expected.
      expect(namedClient).toBeInstanceOf(OpenFeatureClient);
      expect(namedClient.metadata.name).toEqual(name);
    });

    it('should be chainable', () => {
      const client = OpenFeature.addHooks()
        .clearHooks()
        .setLogger(console)
        .getClient();


      expect(client).toBeDefined();
    });


  });

  describe('Requirement 1.6.1', () => {
    it('MUST define a `shutdown` function, which, when called, must call the respective `shutdown` function on the active provider', () => {
      OpenFeature.setProvider(MOCK_PROVIDER);
      expect(OpenFeature['_provider']).toBe(MOCK_PROVIDER);
      OpenFeature.close().then(
        () => {
          expect(MOCK_PROVIDER.onClose).toHaveBeenCalled();
        });
    });
  });
});
