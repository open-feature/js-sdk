import type { Client } from '@openfeature/web-sdk';
import type { ComputedRef } from 'vue';
import { computed } from 'vue';
import { useOpenFeatureContext } from '../internal/context';

export function useClientRef(): ComputedRef<Client> {
  const context = useOpenFeatureContext();
  return computed(() => context.value.client);
}

export function useOpenFeatureClient(): Client {
  return useClientRef().value;
}
