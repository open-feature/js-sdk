import {
  EvaluationContext,
  FlagValue,
  Logger,
  OpenFeatureCommonAPI,
  ProviderMetadata,
  SafeLogger,
} from '@openfeature/shared';
import { OpenFeatureClient } from './client';
import { NOOP_PROVIDER } from './no-op-provider';
import { Client, Hook, OpenFeatureEventEmitter, Provider, ProviderEvents } from './types';
import { objectOrUndefined, stringOrUndefined } from '@openfeature/shared/src/type-guards';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI {
  protected _hooks: Hook[] = [];
  private readonly _events = new OpenFeatureEventEmitter();
  protected _provider: Provider = NOOP_PROVIDER;
  protected _clientProviders: Map<string, Provider> = new Map();
  protected _clientEvents: Map<string | undefined, OpenFeatureEventEmitter> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
    super();
  }

  /**
   * Gets a singleton instance of the OpenFeature API.
   *
   * @ignore
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  static getInstance(): OpenFeatureAPI {
    const globalApi = _globalThis[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeatureAPI();
    _globalThis[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }

  /**
   * Get metadata about registered provider.
   *
   * @returns {ProviderMetadata} Provider Metadata
   */
  get providerMetadata(): ProviderMetadata {
    return this._provider.metadata;
  }

  setLogger(logger: Logger): this {
    this._logger = new SafeLogger(logger);
    return this;
  }

  addHooks(...hooks: Hook<FlagValue>[]): this {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  getHooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  clearHooks(): this {
    this._hooks = [];
    return this;
  }

  async setContext(context: EvaluationContext): Promise<void> {
    const oldContext = this._context;
    this._context = context;
    await this._provider?.onContextChange?.(oldContext, context);
  }

  /**
   * Sets the provider that OpenFeature will use for flag evaluations of providers without a name.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   *
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {GlobalApi} OpenFeature API
   */
  setProvider(provider: Provider): this;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations of providers with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   *
   * @param {string} clientName The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {GlobalApi} OpenFeature API
   */
  setProvider(clientName: string, provider: Provider): this;
  setProvider(clientOrProvider?: string | Provider, providerOrUndefined?: Provider): this {
    const client = stringOrUndefined(clientOrProvider);
    const provider = objectOrUndefined<Provider>(clientOrProvider) ?? objectOrUndefined<Provider>(providerOrUndefined);

    if (!provider) {
      return this;
    }

    const oldProvider = this.getProviderForClient(client);

    // ignore no-ops
    if (oldProvider === provider) {
      return this;
    }

    if (client) {
      this._clientProviders.set(client, provider);
    } else {
      this._provider = provider;
    }

    const clientEmitter = this.getEventEmitterForClient(client);
    this.transferListeners(oldProvider, provider, clientEmitter);

    if (typeof provider.initialize === 'function') {
      provider
        .initialize?.(this._context)
        ?.then(() => {
          clientEmitter.emit(ProviderEvents.Ready);
          this._events?.emit(ProviderEvents.Ready);
        })
        ?.catch(() => {
          clientEmitter.emit(ProviderEvents.Error);
          this._events?.emit(ProviderEvents.Error);
        });
    } else {
      clientEmitter.emit(ProviderEvents.Ready);
      this._events?.emit(ProviderEvents.Ready);
    }

    oldProvider?.onClose?.();
    return this;
  }

  async close(): Promise<void> {
    await this?._provider?.onClose?.();
  }

  /**
   * A factory function for creating new named OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that name.
   *
   * @param {string} name The name of the client
   * @param {string} version The version of the client (only used for metadata)
   * @returns {Client} OpenFeature Client
   */
  getClient(name?: string, version?: string): Client {
    return new OpenFeatureClient(
      // functions are passed here to make sure that these values are always up to date,
      // and so we don't have to make these public properties on the API class.
      () => this.getProviderForClient(name),
      () => this.getEventEmitterForClient(name),
      () => this._logger,
      { name, version }
    );
  }

  private getProviderForClient(name?: string): Provider {
    if (!name) {
      return this._provider;
    }

    return this._clientProviders.get(name) ?? this._provider;
  }

  private getEventEmitterForClient(name?: string): OpenFeatureEventEmitter {
    const emitter = this._clientEvents.get(name);

    if (emitter) {
      return emitter;
    }

    const newEmitter = new OpenFeatureEventEmitter({});
    this._clientEvents.set(name, newEmitter);
    return newEmitter;
  }

  private transferListeners(oldProvider: Provider, newProvider: Provider, clientEmitter: OpenFeatureEventEmitter) {
    oldProvider.events?.removeAllListeners();

    // iterate over the event types
    Object.values(ProviderEvents).forEach((eventType) =>
      newProvider.events?.on(eventType, () => {
        // on each event type, fire the associated handlers
        clientEmitter.emit(eventType);
        this._events.emit(eventType);
      })
    );
  }
}

/**
 * A singleton instance of the OpenFeature API.
 *
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
