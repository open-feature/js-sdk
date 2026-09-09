import { InMemoryProvider, OpenFeature } from '@openfeature/web-sdk';
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { setOpenFeatureScope, useOpenFeatureClient, useOpenFeatureProvider } from '../src';
import ScopeProbe from './fixtures/ScopeProbe.svelte';
import ScopeWrapper from './fixtures/ScopeWrapper.svelte';

function namedProvider(name: string) {
  return Object.assign(new InMemoryProvider({}), { metadata: { name } });
}

describe('scope', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
  });

  describe('setOpenFeatureScope', () => {
    it('binds a domain-scoped, svelte-aware client to child components', async () => {
      await OpenFeature.setProviderAndWait('scoped', namedProvider('scoped-provider'));
      render(ScopeWrapper, { scope: { domain: 'scoped' } });

      expect(screen.getByTestId('domain')).toHaveTextContent('scoped');
      expect(screen.getByTestId('framework')).toHaveTextContent('svelte');
      expect(screen.getByTestId('provider')).toHaveTextContent('scoped-provider');
    });

    it('binds an explicit client to child components', async () => {
      await OpenFeature.setProviderAndWait('explicit', namedProvider('explicit-provider'));
      render(ScopeWrapper, { scope: { client: OpenFeature.getClient('explicit') } });

      expect(screen.getByTestId('domain')).toHaveTextContent('explicit');
      expect(screen.getByTestId('framework')).toHaveTextContent('svelte');
      expect(screen.getByTestId('provider')).toHaveTextContent('explicit-provider');
    });

    it('throws when called outside of component initialization', () => {
      expect(() => setOpenFeatureScope()).toThrow(/lifecycle_outside_component/);
    });

    it('binds the default client when called without arguments', async () => {
      await OpenFeature.setProviderAndWait(namedProvider('default-provider'));
      render(ScopeWrapper, { scope: undefined });

      expect(screen.getByTestId('domain')).toHaveTextContent('default');
      expect(screen.getByTestId('provider')).toHaveTextContent('default-provider');
    });
  });

  describe('without a scope', () => {
    it('falls back to the default client inside components', async () => {
      await OpenFeature.setProviderAndWait(namedProvider('default-provider'));
      render(ScopeProbe);

      expect(screen.getByTestId('domain')).toHaveTextContent('default');
      expect(screen.getByTestId('framework')).toHaveTextContent('svelte');
      expect(screen.getByTestId('provider')).toHaveTextContent('default-provider');
    });

    it('falls back to the default client outside components', async () => {
      await OpenFeature.setProviderAndWait(namedProvider('default-provider'));

      const client = useOpenFeatureClient();
      expect(client.metadata.domain).toBeUndefined();
      expect(client.metadata.framework).toBe('svelte');
      expect(useOpenFeatureProvider().metadata.name).toBe('default-provider');
    });
  });
});
