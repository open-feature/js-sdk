import { InMemoryProvider, OpenFeature } from '@openfeature/web-sdk';
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContextMutation } from '../src';
import { useContextMutator } from '../src';
import ContextMutatorProbe from './fixtures/ContextMutatorProbe.svelte';

const DOMAIN = 'context-mutator';

describe('useContextMutator', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
    vi.restoreAllMocks();
  });

  describe('outside a scope', () => {
    it('should update the default context', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { setContext } = useContextMutator();
      await setContext({ user: 'a' });

      expect(OpenFeature.getContext()).toEqual({ user: 'a' });
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('should not warn when defaultContext is explicitly true', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { setContext } = useContextMutator({ defaultContext: true });
      await setContext({ user: 'a' });

      expect(OpenFeature.getContext()).toEqual({ user: 'a' });
      expect(warn).not.toHaveBeenCalled();
    });

    it('should accept a method taking the previous context', async () => {
      await OpenFeature.setContext({ user: 'a', count: 1 });
      const { setContext } = useContextMutator({ defaultContext: true });
      await setContext((previous) => ({ ...previous, count: 2 }));

      expect(OpenFeature.getContext()).toEqual({ user: 'a', count: 2 });
    });

    it('should detect in-place mutations of the previous context', async () => {
      await OpenFeature.setContext({ user: 'a' });
      const { setContext } = useContextMutator({ defaultContext: true });
      await setContext((previous) => {
        previous.user = 'b';
        return previous;
      });

      expect(OpenFeature.getContext()).toEqual({ user: 'b' });
    });

    it('should detect in-place mutations of nested values in the previous context', async () => {
      await OpenFeature.setContext({ user: { id: 'a', roles: ['viewer'] }, since: new Date(0) });
      const { setContext } = useContextMutator({ defaultContext: true });
      await setContext((previous) => {
        (previous.user as { roles: string[] }).roles.push('editor');
        return previous;
      });

      expect(OpenFeature.getContext()).toEqual({ user: { id: 'a', roles: ['viewer', 'editor'] }, since: new Date(0) });
    });

    it('should noop if the previous context is passed in unchanged', async () => {
      await OpenFeature.setContext({ user: 'a' });
      const spy = vi.spyOn(OpenFeature, 'setContext');
      const { setContext } = useContextMutator({ defaultContext: true });
      await setContext((previous) => previous);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('inside a scope', () => {
    it('should update the context of the scope domain', async () => {
      await OpenFeature.setProviderAndWait(DOMAIN, new InMemoryProvider({}));
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      let mutation: ContextMutation | undefined;
      render(ContextMutatorProbe, { scope: { domain: DOMAIN }, onReady: (m: ContextMutation) => (mutation = m) });

      await mutation?.setContext({ user: 'scoped' });

      expect(OpenFeature.getContext(DOMAIN)).toEqual({ user: 'scoped' });
      expect(OpenFeature.getContext()).toEqual({});
      expect(warn).not.toHaveBeenCalled();
    });

    it('should update the context of the scope client', async () => {
      await OpenFeature.setProviderAndWait(DOMAIN, new InMemoryProvider({}));
      let mutation: ContextMutation | undefined;
      render(ContextMutatorProbe, {
        scope: { client: OpenFeature.getClient(DOMAIN) },
        onReady: (m: ContextMutation) => (mutation = m),
      });

      await mutation?.setContext({ user: 'scoped' });

      expect(OpenFeature.getContext(DOMAIN)).toEqual({ user: 'scoped' });
      expect(OpenFeature.getContext()).toEqual({});
    });

    it('should update the default context when defaultContext is true', async () => {
      await OpenFeature.setProviderAndWait(DOMAIN, new InMemoryProvider({}));
      let mutation: ContextMutation | undefined;
      render(ContextMutatorProbe, {
        scope: { domain: DOMAIN },
        options: { defaultContext: true },
        onReady: (m: ContextMutation) => (mutation = m),
      });

      await mutation?.setContext({ user: 'global' });

      expect(OpenFeature.getContext()).toEqual({ user: 'global' });
      expect(OpenFeature.getContext(DOMAIN)).toEqual({ user: 'global' });
    });
  });
});
