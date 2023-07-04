export enum ProviderEvents {
  /**
   * The provider is ready to evaluate flags.
   */
  Ready = 'PROVIDER_READY',

  /**
   * The provider is in an error state.
   */
  Error = 'PROVIDER_ERROR',

  /**
   * The flag configuration in the source-of-truth has changed.
   */
  ConfigurationChanged = 'PROVIDER_CONFIGURATION_CHANGED',

  /**
   * The provider's cached state is no longer valid and may not be up-to-date with the source of truth.
   */
  Stale = 'PROVIDER_STALE',
}
