import { OpenFeatureClient } from '../src/client.js';
import { OpenFeature } from '../src/open-feature.js';
import { Provider } from '../src/types.js';

describe(OpenFeature.name, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.1', () => {
    it('should be global singleton', () => {
      expect(OpenFeature.provider === OpenFeature.provider).toBeTruthy();
    });
  });

  describe('Requirement 1.2', () => {
    it('should equal previously set provider', () => {
      const fakeProvider = {} as Provider;
      OpenFeature.provider = fakeProvider;
      expect(OpenFeature.provider === fakeProvider).toBeTruthy();
    });
  });

  describe('Requirement 1.3', () => {
    it('should allow addition of hooks', () => {
      expect(OpenFeature.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.4', () => {
    it('should implement a provider accessor and mutator', () => {
      expect(OpenFeature.provider).toBeDefined();
    });
  });

  describe('Requirement 1.5', () => {
    it('should implement a client factory', () => {
      expect(OpenFeature.getClient).toBeDefined();
      expect(OpenFeature.getClient()).toBeInstanceOf(OpenFeatureClient);

      const name = 'my-client';
      const namedClient = OpenFeature.getClient(name);

      // check that using a named configuration also works as expected.
      expect(namedClient).toBeInstanceOf(OpenFeatureClient);
      expect(namedClient.name).toEqual(name);
    });
  });
});
