import { ErrorCode, OpenFeature } from '../src';

describe('package exports', () => {
  it('re-exports the web SDK', () => {
    expect(OpenFeature.getClient).toBeDefined();
    expect(ErrorCode.FLAG_NOT_FOUND).toBe('FLAG_NOT_FOUND');
  });
});
