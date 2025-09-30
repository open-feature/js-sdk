import type { EventDetails, ProviderEventEmitter, AnyProviderEvent } from '../../events';
import type { RegisteredProvider } from './types';

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
    private statusEnum: Record<string, TProviderStatus>,
    private eventEnum: Record<string, TProviderEvents>,
  ) {}

  wrapEventHandler(providerEntry: RegisteredProvider<TProvider>) {
    const provider = providerEntry.provider;
    provider.events?.addHandler(this.eventEnum.Error as TProviderEvents, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, this.statusEnum.ERROR, details);
    });

    provider.events?.addHandler(this.eventEnum.Stale as TProviderEvents, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, this.statusEnum.STALE, details);
    });

    provider.events?.addHandler(this.eventEnum.ConfigurationChanged as TProviderEvents, (details?: EventDetails) => {
      this.events.emit(this.eventEnum.ConfigurationChanged as TProviderEvents, details);
    });

    provider.events?.addHandler(this.eventEnum.Ready as TProviderEvents, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, this.statusEnum.READY, details);
    });
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
    }
    return this.statusEnum.READY;
  }

  private changeProviderStatus(name: string, status: TProviderStatus, details?: EventDetails) {
    const currentStatus = this.getStatusFromProviderStatuses();
    this.providerStatuses[name] = status;
    const newStatus = this.getStatusFromProviderStatuses();
    if (currentStatus !== newStatus) {
      if (newStatus === this.statusEnum.FATAL || newStatus === this.statusEnum.ERROR) {
        this.events.emit(this.eventEnum.Error as TProviderEvents, details);
      } else if (newStatus === this.statusEnum.STALE) {
        this.events.emit(this.eventEnum.Stale as TProviderEvents, details);
      } else if (newStatus === this.statusEnum.READY) {
        this.events.emit(this.eventEnum.Ready as TProviderEvents, details);
      }
    }
  }
}
