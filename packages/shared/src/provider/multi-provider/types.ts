import type { AllProviderStatus, CommonProvider } from '../../provider';

export type ProviderEntryInput<
  TProvider extends CommonProvider<AllProviderStatus> = CommonProvider<AllProviderStatus>,
> = {
  provider: TProvider;
  name?: string;
};

export type RegisteredProvider<
  TProvider extends CommonProvider<AllProviderStatus> = CommonProvider<AllProviderStatus>,
> = Required<ProviderEntryInput<TProvider>>;
