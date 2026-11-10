import { InMemoryProvider, OpenFeature } from '@openfeature/web-sdk';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Track } from '../src';
import { useTrack } from '../src';
import TrackProbe from './fixtures/TrackProbe.svelte';

const EVENT_NAME = 'my-event';
const EVENT_DETAILS = { value: 42 };

class TrackingProvider extends InMemoryProvider {
  track = vi.fn();
}

describe('useTrack', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
  });

  describe('no scope', () => {
    it('should call the default provider', async () => {
      const provider = new TrackingProvider({});
      await OpenFeature.setProviderAndWait(provider);

      const { track } = useTrack();
      track(EVENT_NAME, EVENT_DETAILS);

      expect(provider.track).toHaveBeenCalledWith(EVENT_NAME, expect.anything(), EVENT_DETAILS);
    });
  });

  describe('scope with domain', () => {
    it('should call the provider for the domain', async () => {
      const domain = 'tracking';
      const defaultProvider = new TrackingProvider({});
      const domainProvider = new TrackingProvider({});
      await OpenFeature.setProviderAndWait(defaultProvider);
      await OpenFeature.setProviderAndWait(domain, domainProvider);

      let tracking: Track | undefined;
      render(TrackProbe, { scope: { domain }, onReady: (t: Track) => (tracking = t) });
      tracking?.track(EVENT_NAME, EVENT_DETAILS);

      expect(domainProvider.track).toHaveBeenCalledWith(EVENT_NAME, expect.anything(), EVENT_DETAILS);
      expect(defaultProvider.track).not.toHaveBeenCalled();
    });
  });
});
