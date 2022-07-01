import { OpenFeatureClient } from '../src/client.js';
import { OpenFeature } from '../src/open-feature.js';
import { Provider } from '../src/types.js';

describe(OpenFeature.name, () => {
  const openFeature: OpenFeature = OpenFeature.getInstance();
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Requirement 1.1.2', () => {
    it('should equal previously set provider', () => {
      const fakeProvider = { metadata: 'test' } as unknown as Provider;
      openFeature.setProvider(fakeProvider);
      expect(openFeature.providerMetadata === fakeProvider.metadata).toBeTruthy();
    });
  });

  describe('Requirement 1.1.3', () => {
    it('should allow addition of hooks', () => {
      expect(openFeature.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.1.4', () => {
    it('should implement a provider metadata accessor and mutator', () => {
      expect(openFeature.providerMetadata).toBeDefined();
    });
  });

  describe('Requirement 1.1.5', () => {
    it('should implement a client factory', () => {
      expect(openFeature.getClient).toBeDefined();
      expect(openFeature.getClient()).toBeInstanceOf(OpenFeatureClient);

      const name = 'my-client';
      const namedClient = openFeature.getClient(name);

      // check that using a named configuration also works as expected.
      expect(namedClient).toBeInstanceOf(OpenFeatureClient);
      expect(namedClient.metadata.name).toEqual(name);
    });
  });
});
