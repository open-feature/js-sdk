import { normalizeOptions } from '../src/common/options';

describe('normalizeOptions', () => {
  // we spread results from this function, so we never want to return null
  describe('undefined options', () => {
    it('should return empty object', () => {
      const normalized = normalizeOptions();
      expect(normalized).toEqual({});
    });
  });

  // we spread results from this function, so we want to remove anything but explicit booleans
  describe('undefined removal', () => {
    it('should remove undefined props and maintain boolean props', () => {
      const normalized = normalizeOptions({
        suspendUntilReady: undefined,
        suspendWhileReconciling: false,
        updateOnConfigurationChanged: undefined,
        updateOnContextChanged: true,
      });
      expect(normalized).not.toHaveProperty('suspendUntilReady');
      expect(normalized).toHaveProperty('suspendWhileReconciling');
      expect(normalized.suspendWhileReconciling).toEqual(false);
      expect(normalized).not.toHaveProperty('updateOnConfigurationChanged');
      expect(normalized).toHaveProperty('updateOnContextChanged');
      expect(normalized.updateOnContextChanged).toEqual(true);
    });
  });

  // we fallback the more specific suspense props (`suspendUntilReady` and `suspendWhileReconciling`) to `suspend`
  describe('suspend fallback', () => {
    it('should fallback to true suspend value', () => {
      const normalized = normalizeOptions({
        suspend: true,
      });
      expect(normalized.suspendUntilReady).toEqual(true);
      expect(normalized.suspendWhileReconciling).toEqual(true);
    });
    it('should fallback to false suspend value', () => {
      const normalized = normalizeOptions({
        suspend: false,
      });
      expect(normalized.suspendUntilReady).toEqual(false);
      expect(normalized.suspendWhileReconciling).toEqual(false);
    });
  });
});
