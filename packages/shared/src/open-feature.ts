import type { OpenFeatureError } from './errors';
import { GeneralError } from './errors';
import type { EvaluationContext } from './evaluation';
import { ErrorCode } from './evaluation';
import type {
  AnyProviderEvent,
  EventDetails,
  EventHandler,
  Eventing,
  EventOptions,
  GenericEventEmitter,
} from './events';
import { AllProviderEvents, statusMatchesEvent } from './events';
import { isDefined } from './filter';
import type { BaseHook, EvaluationLifeCycle } from './hooks';
import type { Logger, ManageLogger } from './logger';
import { DefaultLogger, SafeLogger } from './logger';
import type { ClientProviderStatus, CommonProvider, ProviderMetadata, ServerProviderStatus } from './provider';
import { objectOrUndefined, stringOrUndefined } from './type-guards';
import type { Paradigm } from './types';

type AnyProviderStatus = ClientProviderStatus | ServerProviderStatus;

/**
 * A provider and its current status.
 * For internal use only.
 */
export class ProviderWrapper<P extends CommonProvider<AnyProviderStatus>, S extends AnyProviderStatus> {
  private _pendingContextChanges = 0;
  private _initializing = false;
  private _initialized = false;

  constructor(
    private _provider: P,
    private _status: S,
    _statusEnumType: typeof ClientProviderStatus | typeof ServerProviderStatus,
  ) {
    // update the providers status with events
    _provider.events?.addHandler(AllProviderEvents.Ready, () => {
      // These casts are due to the face we don't "know" what status enum we are dealing with here (client or server).
      // We could abstract this an implement it in the client/server libs to fix this, but the value is low.
      this._status = _statusEnumType.READY as S;
    });
    _provider.events?.addHandler(AllProviderEvents.Stale, () => {
      this._status = _statusEnumType.STALE as S;
    });
    _provider.events?.addHandler(AllProviderEvents.Error, (details) => {
      if (details?.errorCode === ErrorCode.PROVIDER_FATAL) {
        this._status = _statusEnumType.FATAL as S;
      } else {
        this._status = _statusEnumType.ERROR as S;
      }
    });

    this._initialized = !(typeof _provider.initialize === 'function');
  }

  get provider(): P {
    return this._provider;
  }

  set provider(provider: P) {
    this._provider = provider;
  }

  get status(): S {
    return this._status;
  }

  set status(status: S) {
    this._status = status;
  }

  get initializing() {
    return this._initializing;
  }

  set initializing(initializing: boolean) {
    this._initializing = initializing;
  }

  get initialized() {
    return this._initialized;
  }

  set initialized(initialized: boolean) {
    this._initialized = initialized;
  }

  get allContextChangesSettled() {
    return this._pendingContextChanges === 0;
  }

  incrementPendingContextChanges() {
    this._pendingContextChanges++;
  }

  decrementPendingContextChanges() {
    this._pendingContextChanges--;
  }
}

export abstract class OpenFeatureCommonAPI<
  S extends AnyProviderStatus,
  P extends CommonProvider<S> = CommonProvider<S>,
  H extends BaseHook = BaseHook,
>
  implements
    Eventing<AnyProviderEvent>,
    EvaluationLifeCycle<OpenFeatureCommonAPI<S, P>>,
    ManageLogger<OpenFeatureCommonAPI<S, P>>
{
  // accessor for the type of the ProviderStatus enum (client or server)
  protected abstract readonly _statusEnumType: typeof ClientProviderStatus | typeof ServerProviderStatus;
  protected abstract _createEventEmitter(): GenericEventEmitter<AnyProviderEvent>;
  protected abstract _defaultProvider: ProviderWrapper<P, AnyProviderStatus>;
  protected abstract readonly _domainScopedProviders: Map<string, ProviderWrapper<P, AnyProviderStatus>>;
  protected abstract readonly _apiEmitter: GenericEventEmitter<AnyProviderEvent>;

  protected _hooks: H[] = [];
  protected _context: EvaluationContext = {};
  protected _logger: Logger = new DefaultLogger();

  private readonly _clientEventHandlers: Map<string | undefined, [AnyProviderEvent, EventHandler][]> = new Map();
  protected _domainScopedContext: Map<string, EvaluationContext> = new Map();
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
   * @param {string} domain An identifier which logically binds clients with providers
   * @returns {ProviderMetadata} Provider Metadata
   */
  getProviderMetadata(domain?: string): ProviderMetadata {
    return this.getProviderForClient(domain).metadata;
  }

  /**
   * Adds a handler for the given provider event type.
   * The handlers are called in the order they have been added.
   * API (global) events run for all providers.
   * @param {AnyProviderEvent} eventType The provider event type to listen to
   * @param {EventHandler} handler The handler to run on occurrence of the event type
   * @param {EventOptions} options Optional options such as signal for aborting
   */
  addHandler<T extends AnyProviderEvent>(eventType: T, handler: EventHandler, options?: EventOptions): void {
    [...new Map([[undefined, this._defaultProvider]]), ...this._domainScopedProviders].forEach((keyProviderTuple) => {
      const domain = keyProviderTuple[0];
      const provider = keyProviderTuple[1].provider;
      const status = keyProviderTuple[1].status;
      const shouldRunNow = statusMatchesEvent(eventType, status);

      if (shouldRunNow) {
        // run immediately, we're in the matching state
        try {
          handler({ domain, providerName: provider.metadata.name });
        } catch (err) {
          this._logger?.error('Error running event handler:', err);
        }
      }
    });

    this._apiEmitter.addHandler(eventType, handler);
    if (options?.signal && typeof options.signal.addEventListener === 'function') {
      options.signal.addEventListener('abort', () => {
        this.removeHandler(eventType, handler);
      });
    }
  }

  /**
   * Removes a handler for the given provider event type.
   * @param {AnyProviderEvent} eventType The provider event type to remove the listener for
   * @param {EventHandler} handler The handler to remove for the provider event type
   */
  removeHandler<T extends AnyProviderEvent>(eventType: T, handler: EventHandler): void {
    this._apiEmitter.removeHandler(eventType, handler);
  }

  /**
   * Removes all event handlers.
   */
  clearHandlers(): void {
    this._apiEmitter.removeAllHandlers();
  }

  /**
   * Gets the current handlers for the given provider event type.
   * @param {AnyProviderEvent} eventType The provider event type to get the current handlers for
   * @returns {EventHandler[]} The handlers currently attached to the given provider event type
   */
  getHandlers<T extends AnyProviderEvent>(eventType: T): EventHandler[] {
    return this._apiEmitter.getHandlers(eventType);
  }

  abstract setProviderAndWait(
    clientOrProvider?: string | P,
    providerContextOrUndefined?: P | EvaluationContext,
    contextOptionsOrUndefined?: EvaluationContext | Record<never, never>,
    optionsOrUndefined?: Record<never, never>,
  ): Promise<void>;

  abstract setProvider(
    clientOrProvider?: string | P,
    providerContextOrUndefined?: P | EvaluationContext,
    contextOptionsOrUndefined?: EvaluationContext | Record<never, never>,
    optionsOrUndefined?: Record<never, never>,
  ): this;

  protected initializeProviderForDomain(
    wrapper: ProviderWrapper<P, AnyProviderStatus>,
    domain?: string,
  ): Promise<void> | void {
    if (typeof wrapper.provider.initialize !== 'function' || wrapper.initializing || wrapper.initialized) {
      return;
    }

    wrapper.initializing = true;
    return wrapper.provider
      .initialize(domain ? (this._domainScopedContext.get(domain) ?? this._context) : this._context)
      .then(() => {
        wrapper.status = this._statusEnumType.READY;
        const payload = { clientName: domain, domain, providerName: wrapper.provider.metadata.name };

        // fetch the most recent event emitters, some may have been added during init
        this.getAssociatedEventEmitters(domain).forEach((emitter) => {
          emitter?.emit(AllProviderEvents.Ready, { ...payload });
        });
        this._apiEmitter?.emit(AllProviderEvents.Ready, { ...payload });
      })
      .catch((error) => {
        // if this is a fatal error, transition to FATAL status
        if ((error as OpenFeatureError)?.code === ErrorCode.PROVIDER_FATAL) {
          wrapper.status = this._statusEnumType.FATAL;
        } else {
          wrapper.status = this._statusEnumType.ERROR;
        }
        const payload = {
          clientName: domain,
          domain,
          providerName: wrapper.provider.metadata.name,
          message: error?.message,
        };

        // fetch the most recent event emitters, some may have been added during init
        this.getAssociatedEventEmitters(domain).forEach((emitter) => {
          emitter?.emit(AllProviderEvents.Error, { ...payload });
        });
        this._apiEmitter?.emit(AllProviderEvents.Error, { ...payload });

        // rethrow after emitting error events, so that public methods can control error handling
        throw error;
      })
      .finally(() => {
        wrapper.initialized = true;
        wrapper.initializing = false;
      });
  }

  protected setAwaitableProvider(
    domainOrProvider?: string | P,
    providerOrUndefined?: P,
    skipInitialization = false,
  ): Promise<void> | void {
    const domain = stringOrUndefined(domainOrProvider);
    const provider = objectOrUndefined<P>(domainOrProvider) ?? objectOrUndefined<P>(providerOrUndefined);

    if (!provider) {
      this._logger.debug('No provider defined, ignoring setProvider call');
      return;
    }

    const oldProvider = this.getProviderForClient(domain);
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

    const emitters = this.getAssociatedEventEmitters(domain);

    let initializationPromise: Promise<void> | void = undefined;
    const wrappedProvider = new ProviderWrapper<P, AnyProviderStatus>(
      provider,
      this._statusEnumType.NOT_READY,
      this._statusEnumType,
    );

    if (!skipInitialization) {
      // initialize the provider if it's not already registered and it implements "initialize"
      if (!this.allProviders.includes(provider)) {
        initializationPromise = this.initializeProviderForDomain(wrappedProvider, domain);
      }

      if (!initializationPromise) {
        wrappedProvider.status = this._statusEnumType.READY;
        emitters.forEach((emitter) => {
          emitter?.emit(AllProviderEvents.Ready, { clientName: domain, domain, providerName });
        });
        this._apiEmitter?.emit(AllProviderEvents.Ready, { clientName: domain, domain, providerName });
      }
    }

    if (domain) {
      this._domainScopedProviders.set(domain, wrappedProvider);
    } else {
      this._defaultProvider = wrappedProvider;
    }

    this.transferListeners(oldProvider, provider, domain, emitters);

    // Do not close a provider that is bound to any client
    if (!this.allProviders.includes(oldProvider)) {
      oldProvider?.onClose?.()?.catch((err: Error | undefined) => {
        this._logger.error(`error closing provider: ${err?.message}, ${err?.stack}`);
      });
    }

    return initializationPromise;
  }

  protected getProviderForClient(domain?: string): P {
    if (!domain) {
      return this._defaultProvider.provider;
    }

    return this._domainScopedProviders.get(domain)?.provider ?? this._defaultProvider.provider;
  }

  protected buildAndCacheEventEmitterForClient(domain?: string): GenericEventEmitter<AnyProviderEvent> {
    const emitter = this._clientEvents.get(domain);

    if (emitter) {
      return emitter;
    }

    // lazily add the event emitters
    const newEmitter = this._createEventEmitter();
    this._clientEvents.set(domain, newEmitter);

    const clientProvider = this.getProviderForClient(domain);
    Object.values<AllProviderEvents>(AllProviderEvents).forEach((eventType) =>
      clientProvider.events?.addHandler(eventType, async (details) => {
        newEmitter.emit(eventType, {
          ...details,
          clientName: domain,
          domain,
          providerName: clientProvider.metadata.name,
        });
      }),
    );

    return newEmitter;
  }

  private getUnboundEmitters(): GenericEventEmitter<AnyProviderEvent>[] {
    const domainScopedProviders = [...this._domainScopedProviders.keys()];
    const eventEmitterNames = [...this._clientEvents.keys()].filter(isDefined);
    const unboundEmitterNames = eventEmitterNames.filter((name) => !domainScopedProviders.includes(name));
    return [
      // all unbound, named emitters
      ...unboundEmitterNames.map((name) => this._clientEvents.get(name)),
      // the default emitter
      this._clientEvents.get(undefined),
    ].filter(isDefined);
  }

  protected getAssociatedEventEmitters(domain: string | undefined) {
    return domain ? [this.buildAndCacheEventEmitterForClient(domain)] : this.getUnboundEmitters();
  }

  private transferListeners(
    oldProvider: P,
    newProvider: P,
    domain: string | undefined,
    emitters: (GenericEventEmitter<AnyProviderEvent> | undefined)[],
  ) {
    this._clientEventHandlers
      .get(domain)
      ?.forEach((eventHandler) => oldProvider.events?.removeHandler(...eventHandler));

    // iterate over the event types
    const newClientHandlers = Object.values(AllProviderEvents).map<[AllProviderEvents, EventHandler]>((eventType) => {
      const handler = async (details?: EventDetails) => {
        // on each event type, fire the associated handlers
        emitters.forEach((emitter) => {
          emitter?.emit(eventType, { ...details, clientName: domain, domain, providerName: newProvider.metadata.name });
        });
        this._apiEmitter.emit(eventType, {
          ...details,
          clientName: domain,
          domain,
          providerName: newProvider.metadata.name,
        });
      };

      return [eventType, handler];
    });

    this._clientEventHandlers.set(domain, newClientHandlers);
    newClientHandlers.forEach((eventHandler) => newProvider.events?.addHandler(...eventHandler));
  }

  async close(): Promise<void> {
    try {
      await this?._defaultProvider.provider?.onClose?.();
    } catch (err) {
      this.handleShutdownError(this._defaultProvider.provider, err);
    }

    const wrappers = Array.from(this._domainScopedProviders);

    await Promise.all(
      wrappers.map(async ([, wrapper]) => {
        try {
          await wrapper?.provider.onClose?.();
        } catch (err) {
          this.handleShutdownError(wrapper?.provider, err);
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
      this._domainScopedProviders.clear();
      this._defaultProvider = new ProviderWrapper<P, AnyProviderStatus>(
        defaultProvider,
        this._statusEnumType.NOT_READY,
        this._statusEnumType,
      );
    }
  }

  private get allProviders(): P[] {
    return [
      ...[...this._domainScopedProviders.values()].map((wrappers) => wrappers.provider),
      this._defaultProvider.provider,
    ];
  }

  private handleShutdownError(provider: P, err: unknown) {
    this._logger.error(`Error during shutdown of provider ${provider.metadata.name}: ${err}`);
    this._logger.error((err as Error)?.stack);
  }
}
