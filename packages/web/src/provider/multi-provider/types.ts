// Represents an entry in the constructor's provider array which may or may not have a name set
import type { Provider } from '@openfeature/web-sdk';

export type ProviderEntryInput = {
  provider: Provider;
  name?: string;
};

// Represents a processed and "registered" provider entry where a name has been chosen
export type RegisteredProvider = Required<ProviderEntryInput>;
