export type ProviderEntryInput<TProvider> = {
  provider: TProvider;
  name?: string;
};

export type RegisteredProvider<TProvider> = Required<ProviderEntryInput<TProvider>>;
