import { GeneralError } from './errors';
import { EvaluationContext } from './evaluation';
import {
  AllProviderEvents,
  AnyProviderEvent,
  EventDetails,
  EventHandler,
  Eventing,
  GenericEventEmitter,
  statusMatchesEvent,
} from './events';
import { isDefined } from './filter';
import { BaseHook, EvaluationLifeCycle } from './hooks';
import { DefaultLogger, Logger, ManageLogger, SafeLogger } from './logger';
import { CommonProvider, ProviderMetadata, ProviderStatus } from './provider';
import { objectOrUndefined, stringOrUndefined } from './type-guards';
import { Paradigm } from './types';

export abstract class OpenFeatureCommonAPI<P extends CommonProvider = CommonProvider, H extends BaseHook = BaseHook>
  implements Eventing, EvaluationLifeCycle<OpenFeatureCommonAPI<P>>, ManageLogger<OpenFeatureCommonAPI<P>>
{
  protected abstract _createEventEmitter(): GenericEventEmitter<AnyProviderEvent>;
  protected abstract _defaultProvider: P;
  protected abstract readonly _events: GenericEventEmitter<AnyProviderEvent>;

  protected _hooks: H[] = [];
  protected _context: EvaluationContext = {};
  protected _logger: Logger = new DefaultLogger();

  private readonly _clientEventHandlers: Map<string | undefined, [AnyProviderEvent, EventHandler][]> = new Map();
  protected _clientProviders: Map<string, P> = new Map();
  protected _clientEvents: Map<string | undefined, GenericEventEmitter<AnyProviderEvent>> = new Map();
  protected _runsOn: Paradigm;

  constructor(category: Paradigm) {
    this._runsOn = category;
  }

  addHooks(...hooks: H[]): this {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  getHooks(): H[] {
    return this._hooks;
  }

  clearHooks(): this {
    this._hooks = [];
    return this;
  }

  setLogger(logger: Logger): this {
    this._logger = new SafeLogger(logger);
    return this;
  }

  /**
   * Get metadata about the default provider.
   * @returns {ProviderMetadata} Provider Metadata
   */
  get providerMetadata(): ProviderMetadata {
    return this.getProviderMetadata();
  }

  /**
   * Get metadata about a registered provider using the client name.
   * An unbound or empty client name will return metadata from the default provider.
   * @param {string} [clientName] The name to identify the client
   * @returns {ProviderMetadata} Provider Metadata
   */
  getProviderMetadata(clientName?: string): ProviderMetadata {
    return this.getProviderForClient(clientName).metadata;
  }

  /**
   * Adds a handler for the given provider event type.
   * The handlers are called in the order they have been added.
   * API (global) events run for all providers.
   * @param {AnyProviderEvent} eventType The provider event type to listen to
   * @param {EventHandler} handler The handler to run on occurrence of the event type
   */
  addHandler<T extends AnyProviderEvent>(eventType: T, handler: EventHandler): void {
    [...new Map([[undefined, this._defaultProvider]]), ...this._clientProviders].forEach((keyProviderTuple) => {
      const clientName = keyProviderTuple[0];
      const provider = keyProviderTuple[1];
      const shouldRunNow = statusMatchesEvent(eventType, keyProviderTuple[1].status);

      if (shouldRunNow) {
        // run immediately, we're in the matching state
        try {
          handler({ clientName, providerName: provider.metadata.name });
        } catch (err) {
          this._logger?.error('Error running event handler:', err);
        }
      }
    });

    this._events.addHandler(eventType, handler);
  }

  /**
   * Removes a handler for the given provider event type.
   * @param {AnyProviderEvent} eventType The provider event type to remove the listener for
   * @param {EventHandler} handler The handler to remove for the provider event type
   */
  removeHandler<T extends AnyProviderEvent>(eventType: T, handler: EventHandler): void {
    this._events.removeHandler(eventType, handler);
  }

  /**
   * Removes all event handlers.
   */
  clearHandlers(): void {
    this._events.removeAllHandlers();
  }

  /**
   * Gets the current handlers for the given provider event type.
   * @param {AnyProviderEvent} eventType The provider event type to get the current handlers for
   * @returns {EventHandler[]} The handlers currently attached to the given provider event type
   */
  getHandlers<T extends AnyProviderEvent>(eventType: T): EventHandler[] {
    return this._events.getHandlers(eventType);
  }

  /**
   * Sets the default provider for flag evaluations and returns a promise that resolves when the provider is ready.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   * @template P
   * @param {P} provider The provider responsible for flag evaluations.
   * @returns {Promise<void>}
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  async setProviderAndWait(provider: P): Promise<void>;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations of providers with the given name.
   * A promise is returned that resolves when the provider is ready.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   * @template P
   * @param {string} clientName The name to identify the client
   * @param {P} provider The provider responsible for flag evaluations.
   * @returns {Promise<void>}
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  async setProviderAndWait(clientName: string, provider: P): Promise<void>;
  async setProviderAndWait(clientOrProvider?: string | P, providerOrUndefined?: P): Promise<void> {
    await this.setAwaitableProvider(clientOrProvider, providerOrUndefined);
  }

  /**
   * Sets the default provider for flag evaluations.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   * @template P
   * @param {P} provider The provider responsible for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(provider: P): this;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations of providers with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   * @template P
   * @param {string} clientName The name to identify the client
   * @param {P} provider The provider responsible for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(clientName: string, provider: P): this;
  setProvider(clientOrProvider?: string | P, providerOrUndefined?: P): this {
    const maybePromise = this.setAwaitableProvider(clientOrProvider, providerOrUndefined);
    if (maybePromise) {
      maybePromise.catch(() => {
        /* ignore, errors are emitted via the event emitter */
      });
    }
    return this;
  }

  private setAwaitableProvider(clientOrProvider?: string | P, providerOrUndefined?: P): Promise<void> | void {
    const clientName = stringOrUndefined(clientOrProvider);
    const provider = objectOrUndefined<P>(clientOrProvider) ?? objectOrUndefined<P>(providerOrUndefined);

    if (!provider) {
      this._logger.debug('No provider defined, ignoring setProvider call');
      return;
    }

    const oldProvider = this.getProviderForClient(clientName);
    const providerName = provider.metadata.name;

    // ignore no-ops
    if (oldProvider === provider) {
      this._logger.debug('Provider is already set, ignoring setProvider call');
      return;
    }

    if (!provider.runsOn) {
      this._logger.debug(`Provider '${provider.metadata.name}' has not defined its intended use.`);
    } else if (provider.runsOn !== this._runsOn) {
      throw new GeneralError(`Provider '${provider.metadata.name}' is intended for use on the ${provider.runsOn}.`);
    }

    const emitters = this.getAssociatedEventEmitters(clientName);

    // warn of improper implementations
    if (typeof provider.initialize === 'function' && provider.status === undefined) {
      const activeLogger = this._logger || console;
      activeLogger.warn(
        `Provider ${providerName} implements 'initialize' but not 'status'. Please implement 'status'.`,
      );
    }

    let initializationPromise: Promise<void> | void = undefined;

    if (provider?.status === ProviderStatus.NOT_READY && typeof provider.initialize === 'function') {
      initializationPromise = provider
        .initialize?.(this._context)
        ?.then(() => {
          // fetch the most recent event emitters, some may have been added during init
          this.getAssociatedEventEmitters(clientName).forEach((emitter) => {
            emitter?.emit(AllProviderEvents.Ready, { clientName, providerName });
          });
          this._events?.emit(AllProviderEvents.Ready, { clientName, providerName });
        })
        ?.catch((error) => {
          this.getAssociatedEventEmitters(clientName).forEach((emitter) => {
            emitter?.emit(AllProviderEvents.Error, { clientName, providerName, message: error?.message });
          });
          this._events?.emit(AllProviderEvents.Error, { clientName, providerName, message: error?.message });
          // rethrow after emitting error events, so that public methods can control error handling
          throw error;
        });
    } else {
      emitters.forEach((emitter) => {
        emitter?.emit(AllProviderEvents.Ready, { clientName, providerName });
      });
      this._events?.emit(AllProviderEvents.Ready, { clientName, providerName });
    }

    if (clientName) {
      this._clientProviders.set(clientName, provider);
    } else {
      this._defaultProvider = provider;
    }

    this.transferListeners(oldProvider, provider, clientName, emitters);

    // Do not close a provider that is bound to any client
    if (![...this._clientProviders.values(), this._defaultProvider].includes(oldProvider)) {
      oldProvider?.onClose?.();
    }

    return initializationPromise;
  }

  protected getProviderForClient(name?: string): P {
    if (!name) {
      return this._defaultProvider;
    }

    return this._clientProviders.get(name) ?? this._defaultProvider;
  }

  protected buildAndCacheEventEmitterForClient(name?: string): GenericEventEmitter<AnyProviderEvent> {
    const emitter = this._clientEvents.get(name);

    if (emitter) {
      return emitter;
    }

    // lazily add the event emitters
    const newEmitter = this._createEventEmitter();
    this._clientEvents.set(name, newEmitter);

    const clientProvider = this.getProviderForClient(name);
    Object.values<AllProviderEvents>(AllProviderEvents).forEach(
      (eventType) =>
        clientProvider.events?.addHandler(eventType, async (details) => {
          newEmitter.emit(eventType, { ...details, clientName: name, providerName: clientProvider.metadata.name });
        }),
    );

    return newEmitter;
  }

  private getUnboundEmitters(): GenericEventEmitter<AnyProviderEvent>[] {
    const namedProviders = [...this._clientProviders.keys()];
    const eventEmitterNames = [...this._clientEvents.keys()].filter(isDefined);
    const unboundEmitterNames = eventEmitterNames.filter((name) => !namedProviders.includes(name));
    return [
      // all unbound, named emitters
      ...unboundEmitterNames.map((name) => this._clientEvents.get(name)),
      // the default emitter
      this._clientEvents.get(undefined),
    ].filter(isDefined);
  }

  protected getAssociatedEventEmitters(clientName: string | undefined) {
    return clientName ? [this.buildAndCacheEventEmitterForClient(clientName)] : this.getUnboundEmitters();
  }

  private transferListeners(
    oldProvider: P,
    newProvider: P,
    clientName: string | undefined,
    emitters: (GenericEventEmitter<AnyProviderEvent> | undefined)[],
  ) {
    this._clientEventHandlers
      .get(clientName)
      ?.forEach((eventHandler) => oldProvider.events?.removeHandler(...eventHandler));

    // iterate over the event types
    const newClientHandlers = Object.values(AllProviderEvents).map<[AllProviderEvents, EventHandler]>((eventType) => {
      const handler = async (details?: EventDetails) => {
        // on each event type, fire the associated handlers
        emitters.forEach((emitter) => {
          emitter?.emit(eventType, { ...details, clientName, providerName: newProvider.metadata.name });
        });
        this._events.emit(eventType, { ...details, clientName, providerName: newProvider.metadata.name });
      };

      return [eventType, handler];
    });

    this._clientEventHandlers.set(clientName, newClientHandlers);
    newClientHandlers.forEach((eventHandler) => newProvider.events?.addHandler(...eventHandler));
  }

  async close(): Promise<void> {
    try {
      await this?._defaultProvider?.onClose?.();
    } catch (err) {
      this.handleShutdownError(this._defaultProvider, err);
    }

    const providers = Array.from(this._clientProviders);

    await Promise.all(
      providers.map(async ([, provider]) => {
        try {
          await provider.onClose?.();
        } catch (err) {
          this.handleShutdownError(provider, err);
        }
      }),
    );
  }

  protected async clearProvidersAndSetDefault(defaultProvider: P): Promise<void> {
    try {
      await this.close();
    } catch (err) {
      this._logger.error('Unable to cleanly close providers. Resetting to the default configuration.');
    } finally {
      this._clientProviders.clear();
      this._defaultProvider = defaultProvider;
    }
  }

  private handleShutdownError(provider: P, err: unknown) {
    this._logger.error(`Error during shutdown of provider ${provider.metadata.name}: ${err}`);
    this._logger.error((err as Error)?.stack);
  }
}
