import * as sdk from '../src';

describe('package exports', () => {
  it('re-exports the web SDK', () => {
    expect(sdk.OpenFeature.getClient).toBeDefined();
    expect(sdk.ErrorCode.FLAG_NOT_FOUND).toBe('FLAG_NOT_FOUND');
  });

  it('keeps internal helpers out of the public API', () => {
    expect('DEFAULT_OPTIONS' in sdk).toBe(false);
    expect('normalizeOptions' in sdk).toBe(false);
    expect('useClientRef' in sdk).toBe(false);
  });
});
