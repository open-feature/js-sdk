import type { EventDetails, ProviderEventEmitter, AnyProviderEvent } from '../../events';
import type { RegisteredProvider } from './types';

/**
 * Interface for the provider events enum that StatusTracker expects.
 * Must have at least Error, Stale, ConfigurationChanged, and Ready events.
 * Reconciling is optional (web only).
 */
type ProviderEventsEnum<T> = {
  Error: T;
  Stale: T;
  ConfigurationChanged: T;
  Ready: T;
  Reconciling?: T;
};

/**
 * Interface for the provider status enum that StatusTracker expects.
 */
type ProviderStatusEnum<T> = {
  NOT_READY: T;
  READY: T;
  ERROR: T;
  STALE: T;
  FATAL: T;
  RECONCILING?: T;
};

/**
 * Tracks each individual provider's status by listening to emitted events
 * Maintains an overall "status" for the multi provider which represents the "most critical" status out of all providers
 */
export class StatusTracker<
  TProviderEvents extends AnyProviderEvent,
  TProviderStatus,
  TProvider extends { events?: ProviderEventEmitter<TProviderEvents> },
> {
  private readonly providerStatuses: Record<string, TProviderStatus> = {};

  constructor(
    private events: ProviderEventEmitter<TProviderEvents>,
    private statusEnum: ProviderStatusEnum<TProviderStatus>,
    private eventEnum: ProviderEventsEnum<TProviderEvents>,
  ) {}

  wrapEventHandler(providerEntry: RegisteredProvider<TProvider>) {
    const provider = providerEntry.provider;
    provider.events?.addHandler(this.eventEnum.Error, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, this.statusEnum.ERROR, details);
    });

    provider.events?.addHandler(this.eventEnum.Stale, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, this.statusEnum.STALE, details);
    });

    provider.events?.addHandler(this.eventEnum.ConfigurationChanged, (details?: EventDetails) => {
      this.events.emit(this.eventEnum.ConfigurationChanged, details);
    });

    provider.events?.addHandler(this.eventEnum.Ready, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, this.statusEnum.READY, details);
    });

    // Handle Reconciling event (web only - server doesn't have this)
    const reconcilingEvent = this.eventEnum.Reconciling;
    const reconcilingStatus = this.statusEnum.RECONCILING;
    if (reconcilingEvent && reconcilingStatus) {
      provider.events?.addHandler(reconcilingEvent, (details?: EventDetails) => {
        this.changeProviderStatus(providerEntry.name, reconcilingStatus, details);
      });
    }
  }

  providerStatus(name: string) {
    return this.providerStatuses[name];
  }

  private getStatusFromProviderStatuses() {
    const statuses = Object.values(this.providerStatuses);
    if (statuses.includes(this.statusEnum.FATAL)) {
      return this.statusEnum.FATAL;
    } else if (statuses.includes(this.statusEnum.NOT_READY)) {
      return this.statusEnum.NOT_READY;
    } else if (statuses.includes(this.statusEnum.ERROR)) {
      return this.statusEnum.ERROR;
    } else if (statuses.includes(this.statusEnum.STALE)) {
      return this.statusEnum.STALE;
    } else if (this.statusEnum.RECONCILING && statuses.includes(this.statusEnum.RECONCILING)) {
      return this.statusEnum.RECONCILING;
    }
    return this.statusEnum.READY;
  }

  private changeProviderStatus(name: string, status: TProviderStatus, details?: EventDetails) {
    const currentStatus = this.getStatusFromProviderStatuses();
    this.providerStatuses[name] = status;
    const newStatus = this.getStatusFromProviderStatuses();
    if (currentStatus !== newStatus) {
      if (newStatus === this.statusEnum.FATAL || newStatus === this.statusEnum.ERROR) {
        this.events.emit(this.eventEnum.Error, details);
      } else if (newStatus === this.statusEnum.STALE) {
        this.events.emit(this.eventEnum.Stale, details);
      } else if (newStatus === this.statusEnum.READY) {
        this.events.emit(this.eventEnum.Ready, details);
      } else {
        const reconcilingEvent = this.eventEnum.Reconciling;
        if (reconcilingEvent && this.statusEnum.RECONCILING && newStatus === this.statusEnum.RECONCILING) {
          this.events.emit(reconcilingEvent, details);
        }
      }
    }
  }
}
