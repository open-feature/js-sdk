import { describe, expect, it } from 'vitest';
import { normalizeOptions } from '../src/internal/options';

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
        updateOnConfigurationChanged: undefined,
        updateOnContextChanged: true,
      });
      expect(normalized).not.toHaveProperty('updateOnConfigurationChanged');
      expect(normalized).toHaveProperty('updateOnContextChanged');
      expect(normalized.updateOnContextChanged).toEqual(true);
    });

    it('should drop evaluation options that are not update flags', () => {
      const normalized = normalizeOptions({
        updateOnConfigurationChanged: false,
        hookHints: { some: 'hint' },
      });
      expect(normalized).toEqual({ updateOnConfigurationChanged: false });
    });
  });
});
