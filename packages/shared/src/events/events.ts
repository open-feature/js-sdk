// TODO: with TypeScript 5+, we can use computed string properties,
// so we can extract all of these into a shared set of string consts and use that in both enums
// for now we have duplicated them.

/**
 * An enumeration of possible events for server-sdk providers.
 */
export enum ServerProviderEvents {
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

/**
 * An enumeration of possible events for web-sdk providers.
 */
export enum ClientProviderEvents {
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
   * The context associated with the provider has changed, and the provider has reconciled it's associated state.
   */
  ContextChanged = 'PROVIDER_CONTEXT_CHANGED',

  /**
   * The context associated with the provider has changed, and the provider has not yet reconciled its associated state.
   */
  Reconciling = 'PROVIDER_RECONCILING',

  /**
   * The provider's cached state is no longer valid and may not be up-to-date with the source of truth.
   */
  Stale = 'PROVIDER_STALE',
}


/* alias because in many cases, we iterate over all possible events in code,
so we have to do this on ClientProviderEvents to be exhaustive */
export { ClientProviderEvents as AllProviderEvents };

/**
 * A type representing any possible ProviderEvent (server or client side).
 * In most cases, you probably want to import `ProviderEvents` from the respective SDK.
 */
export type AnyProviderEvent = ServerProviderEvents | ClientProviderEvents;
