import { OpenFeature, ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
import { afterEach, describe, expect, it } from 'vitest';
import { useOpenFeatureClientStatus, useWhenProviderReady } from '../src';
import { TestingProvider } from './helpers/testing-provider';
import { flush, watch } from './helpers/watch.svelte';

const DOMAIN = 'status';

describe('status', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
  });

  describe('useOpenFeatureClientStatus', () => {
    it('reflects the provider status reactively', async () => {
      const provider = new TestingProvider({}, 10);
      const ready = OpenFeature.setProviderAndWait(provider);
      const status = useOpenFeatureClientStatus();
      const watched = watch(() => status.current);

      expect(watched.values).toEqual([ProviderStatus.NOT_READY]);
      await ready;
      flush();
      expect(watched.values).toEqual([ProviderStatus.NOT_READY, ProviderStatus.READY]);
      watched.stop();
    });

    it('does not re-run effects when subscribing to an already ready provider', async () => {
      const provider = new TestingProvider({}, 0);
      await OpenFeature.setProviderAndWait(provider);
      const status = useOpenFeatureClientStatus();
      const watched = watch(() => status.current);

      // a configuration change emits an event, but the status stays READY
      provider.events.emit(ProviderEvents.ConfigurationChanged, {});
      flush();
      expect(watched.values).toEqual([ProviderStatus.READY]);
      watched.stop();
    });

    it('reads the current status outside effects', async () => {
      await OpenFeature.setProviderAndWait(new TestingProvider({}, 0));
      expect(useOpenFeatureClientStatus().current).toBe(ProviderStatus.READY);
    });

    it('stops listening once the last effect is destroyed', async () => {
      const provider = new TestingProvider({}, 10);
      const ready = OpenFeature.setProviderAndWait(DOMAIN, provider);
      const client = OpenFeature.getClient(DOMAIN);
      const initialHandlers = client.getHandlers(ProviderEvents.Ready).length;
      const status = useOpenFeatureClientStatus();
      const watched = watch(() => status.current);
      watched.stop();
      await ready;
      // handlers were removed, so no further values were recorded
      expect(watched.values).toEqual([ProviderStatus.NOT_READY]);
      expect(client.getHandlers(ProviderEvents.Ready).length).toBe(initialHandlers);
    });
  });

  describe('useWhenProviderReady', () => {
    it('is false until the provider is ready, then true', async () => {
      const provider = new TestingProvider({}, 10);
      const ready = OpenFeature.setProviderAndWait(provider);
      const isReady = useWhenProviderReady();
      const watched = watch(() => isReady.current);

      expect(watched.values).toEqual([false]);
      await ready;
      flush();
      expect(watched.values).toEqual([false, true]);
      watched.stop();
    });
  });
});
