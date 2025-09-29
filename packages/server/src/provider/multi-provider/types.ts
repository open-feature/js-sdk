import type { Provider } from '../provider';

export type ProviderEntryInput = {
  provider: Provider;
  name?: string;
};

export type RegisteredProvider = Required<ProviderEntryInput>;
