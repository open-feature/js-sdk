import { ManageTransactionContextPropagator, NOOP_TRANSACTION_CONTEXT_PROPAGATOR } from './transaction-context';
import { objectOrUndefined, stringOrUndefined } from './type-guards';
import { isDefined } from './filter';
import { DefaultLogger, ManageLogger, SafeLogger } from './logger';
import { CommonProvider, ProviderMetadata } from './provider';
import { EventDetails, EventHandler, Eventing, OpenFeatureEventEmitter, ProviderEvents } from './events';
import { TransactionContext, TransactionContextPropagator } from './transaction-context';
import { EvaluationContext, FlagValue } from './evaluation';
import { Logger } from './logger';
import { EvaluationLifeCycle, Hook } from './hooks';

export abstract class OpenFeatureCommonAPI<P extends CommonProvider = CommonProvider>
  implements
    Eventing,
    EvaluationLifeCycle<OpenFeatureCommonAPI<P>>,
    ManageLogger<OpenFeatureCommonAPI<P>>,
    ManageTransactionContextPropagator<OpenFeatureCommonAPI<P>>
{
  protected _hooks: Hook[] = [];
  protected _transactionContextPropagator: TransactionContextPropagator = NOOP_TRANSACTION_CONTEXT_PROPAGATOR;
  protected _context: EvaluationContext = {};
  protected _logger: Logger = new DefaultLogger();

  protected abstract _defaultProvider: P;

  private readonly _events = new OpenFeatureEventEmitter(() => this._logger);
  private readonly _clientEventHandlers: Map<string | undefined, [ProviderEvents, EventHandler][]> = new Map();
  protected _clientProviders: Map<string, P> = new Map();
  protected _clientEvents: Map<string | undefined, OpenFeatureEventEmitter> = new Map();

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

  setLogger(logger: Logger): this {
    this._logger = new SafeLogger(logger);
    return this;
  }

  /**
   * Get metadata about registered provider.
   * @returns {ProviderMetadata} Provider Metadata
   */
  get providerMetadata(): ProviderMetadata {
    return this._defaultProvider.metadata;
  }

  /**
   * Adds a handler for the given provider event type.
   * The handlers are called in the order they have been added.
   * When changing the provider, the currently attached handlers will listen to the events of the new provider.
   * @param {ProviderEvents} eventType The provider event type to listen to
   * @param {EventHandler} handler The handler to run on occurrence of the event type
   */
  addHandler(eventType: ProviderEvents, handler: EventHandler): void {
    this._events.addHandler(eventType, handler);
  }

  /**
   * Removes a handler for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to remove the listener for
   * @param {EventHandler} handler The handler to remove for the provider event type
   */
  removeHandler(eventType: ProviderEvents, handler: EventHandler): void {
    this._events.removeHandler(eventType, handler);
  }

  /**
   * Gets the current handlers for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to get the current handlers for
   * @returns {EventHandler[]} The handlers currently attached to the given provider event type
   */
  getHandlers(eventType: ProviderEvents): EventHandler[] {
    return this._events.getHandlers(eventType);
  }

  /**
   * Sets the default provider for flag evaluations.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   * @template P
   * @param {P} provider The provider responsible for flag evaluations.
   * @returns {OpenFeatureCommonAPI} OpenFeature API
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
    const clientName = stringOrUndefined(clientOrProvider);
    const provider = objectOrUndefined<P>(clientOrProvider) ?? objectOrUndefined<P>(providerOrUndefined);

    if (!provider) {
      return this;
    }

    const oldProvider = this.getProviderForClient(clientName);

    // ignore no-ops
    if (oldProvider === provider) {
      return this;
    }

    // get the named emitter, or if this is the default provider, get all event emitters not associated with a provider
    const emitters = clientName ? [this.getAndCacheEventEmitterForClient(clientName)] : this.getUnboundEmitters();

    if (typeof provider.initialize === 'function') {
      provider
        .initialize?.(this._context)
        ?.then(() => {
          emitters.forEach((emitter) => {
            emitter?.emit(ProviderEvents.Ready, { clientName });
          });
          this._events?.emit(ProviderEvents.Ready, { clientName });
        })
        ?.catch((error) => {
          emitters.forEach((emitter) => {
            emitter?.emit(ProviderEvents.Error, { clientName, message: error.message });
          });
          this._events?.emit(ProviderEvents.Error, { clientName, message: error.message });
        });
    } else {
      emitters.forEach((emitter) => {
        emitter?.emit(ProviderEvents.Ready, { clientName });
      });
      this._events?.emit(ProviderEvents.Ready, { clientName });
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

    return this;
  }

  protected getProviderForClient(name?: string): P {
    if (!name) {
      return this._defaultProvider;
    }

    return this._clientProviders.get(name) ?? this._defaultProvider;
  }

  protected getAndCacheEventEmitterForClient(name?: string): OpenFeatureEventEmitter {
    const emitter = this._clientEvents.get(name);

    if (emitter) {
      return emitter;
    }

    // lazily add the event emitters
    const newEmitter = new OpenFeatureEventEmitter(() => this._logger);
    this._clientEvents.set(name, newEmitter);

    const clientProvider = this.getProviderForClient(name);
    Object.values<ProviderEvents>(ProviderEvents).forEach((eventType) =>
      clientProvider.events?.addHandler(eventType, async (details?: EventDetails) => {
        newEmitter.emit(eventType, { ...details, clientName: name });
      })
    );

    return newEmitter;
  }

  private getUnboundEmitters(): OpenFeatureEventEmitter[] {
    const namedProviders = [...this._clientProviders.keys()];
    const eventEmitterNames = [...this._clientEvents.keys()].filter(isDefined);
    const unboundEmitterNames = eventEmitterNames.filter((name) => !namedProviders.includes(name));
    return unboundEmitterNames.map((name) => this._clientEvents.get(name)).filter(isDefined);
  }

  private transferListeners(
    oldProvider: P,
    newProvider: P,
    clientName: string | undefined,
    emitters: (OpenFeatureEventEmitter | undefined)[]
  ) {
    this._clientEventHandlers
      .get(clientName)
      ?.forEach((eventHandler) => oldProvider.events?.removeHandler(...eventHandler));

    // iterate over the event types
    const newClientHandlers = Object.values<ProviderEvents>(ProviderEvents).map<[ProviderEvents, EventHandler]>(
      (eventType) => {
        const handler = async (details?: EventDetails) => {
          // on each event type, fire the associated handlers
          emitters.forEach((emitter) => {
            emitter?.emit(eventType, { ...details, clientName });
          });
          this._events.emit(eventType, { ...details, clientName });
        };

        return [eventType, handler];
      }
    );

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
          this.handleShutdownError(this._defaultProvider, err);
        }
      })
    );
  }

  private handleShutdownError(provider: P, err: unknown) {
    this._logger.error(`Error during shutdown of provider ${provider.metadata.name}: ${err}`);
    this._logger.error((err as Error)?.stack);
  }

  setTransactionContextPropagator(transactionContextPropagator: TransactionContextPropagator): OpenFeatureCommonAPI<P> {
    const baseMessage = 'Invalid TransactionContextPropagator, will not be set: ';
    if (typeof transactionContextPropagator?.getTransactionContext !== 'function') {
      this._logger.error(`${baseMessage}: getTransactionContext is not a function.`);
    } else if (typeof transactionContextPropagator?.setTransactionContext !== 'function') {
      this._logger.error(`${baseMessage}: setTransactionContext is not a function.`);
    } else {
      this._transactionContextPropagator = transactionContextPropagator;
    }
    return this;
  }

  setTransactionContext<R>(
    transactionContext: TransactionContext,
    callback: (...args: unknown[]) => R,
    ...args: unknown[]
  ): void {
    this._transactionContextPropagator.setTransactionContext(transactionContext, callback, ...args);
  }

  getTransactionContext(): TransactionContext {
    try {
      return this._transactionContextPropagator.getTransactionContext();
    } catch (err: unknown) {
      const error = err as Error | undefined;
      this._logger.error(`Error getting transaction context: ${error?.message}, returning empty context.`);
      this._logger.error(error?.stack);
      return {};
    }
  }
}
