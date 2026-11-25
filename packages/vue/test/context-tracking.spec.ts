import type { EvaluationContext, Provider } from '@openfeature/web-sdk';
import { OpenFeature, ProviderEvents, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { flushPromises } from '@vue/test-utils';
import { computed, nextTick, ref } from 'vue';
import { useContextMutator, useTrack } from '../src';
import { mountComposableInProvider } from './utils';

describe('context and tracking composables', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  it('sets context for the provider domain', async () => {
    const domain = 'context-domain';
    const provider = new TypedInMemoryProvider({});
    await OpenFeature.setProviderAndWait(domain, provider);
    const changed = jest.fn();
    OpenFeature.getClient(domain).addHandler(ProviderEvents.ContextChanged, changed);
    const { result, wrapper } = mountComposableInProvider(() => useContextMutator(), { domain });

    await result.setContext({ user: 'bob' });

    expect(OpenFeature.getContext(domain)).toEqual({ user: 'bob' });
    expect(changed).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('passes the current domain context to functional updates', async () => {
    const domain = 'context-updater';
    const provider = new TypedInMemoryProvider({});
    await OpenFeature.setProviderAndWait(domain, provider, { user: 'alice', plan: 'free' });
    const { result, wrapper } = mountComposableInProvider(() => useContextMutator(), { domain });

    await result.setContext((current: EvaluationContext) => ({ ...current, plan: 'pro' }));

    expect(OpenFeature.getContext(domain)).toEqual({ user: 'alice', plan: 'pro' });
    wrapper.unmount();
  });

  it('can mutate the default context without changing the domain context', async () => {
    const domain = 'context-default';
    const provider = new TypedInMemoryProvider({});
    await OpenFeature.setProviderAndWait(domain, provider, { user: 'domain-user' });
    await OpenFeature.setContext({ user: 'default-user' });
    const { result, wrapper } = mountComposableInProvider(() => useContextMutator({ defaultContext: true }), {
      domain,
    });

    await result.setContext({ user: 'new-default-user' });

    expect(OpenFeature.getContext()).toEqual({ user: 'new-default-user' });
    expect(OpenFeature.getContext(domain)).toEqual({ user: 'domain-user' });
    wrapper.unmount();
  });

  it('does not reconcile when the context reference is unchanged', async () => {
    const domain = 'context-same-reference';
    const provider = new TypedInMemoryProvider({});
    await OpenFeature.setProviderAndWait(domain, provider, { user: 'alice' });
    const changed = jest.fn();
    OpenFeature.getClient(domain).addHandler(ProviderEvents.ContextChanged, changed);
    const { result, wrapper } = mountComposableInProvider(() => useContextMutator(), { domain });
    const context = OpenFeature.getContext(domain);

    await result.setContext(context);

    expect(changed).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('uses the current client after the provider domain changes', async () => {
    const firstDomain = 'context-first-domain';
    const secondDomain = 'context-second-domain';
    const provider = new TypedInMemoryProvider({});
    await OpenFeature.setProviderAndWait(firstDomain, provider);
    await OpenFeature.setProviderAndWait(secondDomain, new TypedInMemoryProvider({}));
    const domain = ref(firstDomain);
    const providerProps = computed(() => ({ domain: domain.value }));
    const { result, wrapper } = mountComposableInProvider(() => useContextMutator(), providerProps);

    domain.value = secondDomain;
    await nextTick();
    await result.setContext({ user: 'bob' });

    expect(OpenFeature.getContext(firstDomain)).toEqual({});
    expect(OpenFeature.getContext(secondDomain)).toEqual({ user: 'bob' });
    wrapper.unmount();
  });

  it('tracks events with the provider context and details', async () => {
    const domain = 'tracking-domain';
    const track = jest.fn();
    const provider: Provider = Object.assign(new TypedInMemoryProvider({}), { track });
    await OpenFeature.setProviderAndWait(domain, provider, { user: 'bob' });
    const { result, wrapper } = mountComposableInProvider(() => useTrack(), { domain });

    result.track('purchase', { value: 10 });
    await flushPromises();

    expect(track).toHaveBeenCalledWith('purchase', { user: 'bob' }, { value: 10 });
    expect(Object.isFrozen(track.mock.calls[0][1])).toBe(true);
    wrapper.unmount();
  });
});
