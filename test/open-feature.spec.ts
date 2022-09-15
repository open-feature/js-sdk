import { OpenFeatureClient } from '../src/client.js';
import { NOOP_PROVIDER } from '../src/no-op-provider.js';
import { OpenFeature } from '../src/open-feature.js';
import { Provider } from '../src/types.js';

describe('OpenFeature', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.1.2', () => {
    it('should equal previously set provider', () => {
      const fakeProvider = { metadata: 'test' } as unknown as Provider;
      OpenFeature.setProvider(fakeProvider);
      expect(OpenFeature.providerMetadata === fakeProvider.metadata).toBeTruthy();
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
  });

  it('should be chainable', () => {
    const client = OpenFeature.addHooks()
      .clearHooks()
      .setContext({})
      .setLogger(console)
      .setProvider(NOOP_PROVIDER)
      .getClient();

    expect(client).toBeDefined();
  });
});
