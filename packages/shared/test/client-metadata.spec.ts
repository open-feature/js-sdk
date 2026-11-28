import type { ClientMetadata } from '../src';

describe('ClientMetadata', () => {
  it('supports Vue framework metadata', () => {
    const metadata: ClientMetadata = {
      framework: 'vue',
      providerMetadata: { name: 'test-provider' },
    };

    expect(metadata.framework).toBe('vue');
  });
});
