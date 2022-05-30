import { OpenFeatureClient } from '../src/client.js';
import { OpenFeature } from '../src/open-feature.js';
import { Provider } from '../src/types.js';

describe(OpenFeature.name, () => {
  describe('Requirement 1.1', () => {
    it('should be global singleton', () => {
      expect(OpenFeature.instance.provider === OpenFeature.instance.provider).toBeTruthy();
    });
  });

  describe('Requirement 1.2', () => {
    it('should be set provider', () => {
      const fakeProvider = {} as Provider;
      OpenFeature.instance.provider = fakeProvider;
      expect(OpenFeature.instance.provider === fakeProvider).toBeTruthy();
    });
  });

  describe('Requirement 1.3', () => {
    it('should allow addition of hooks', () => {
      // TODO: implement with hooks
    });
  });

  describe('Requirement 1.4', () => {
    it('should implement a hook accessor', () => {
      expect(OpenFeature.instance.provider).toBeDefined();
    });
  });

  describe('Requirement 1.5', () => {
    it('should implement a client factory', () => {
      expect(OpenFeature.instance.getClient).toBeDefined();
      expect(OpenFeature.instance.getClient()).toBeInstanceOf(OpenFeatureClient);

      const name = 'my-client';
      const namedClient = OpenFeature.instance.getClient(name);

      // check that using a named configuration also works as expected.
      expect(namedClient).toBeInstanceOf(OpenFeatureClient);
      expect(namedClient.name).toEqual(name);
    });
  });
});
