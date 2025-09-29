import type { EventDetails, ProviderEventEmitter } from '../../events';
import { AllProviderEvents } from '../../events';
import { AllProviderStatus } from '../../provider';
import type { RegisteredProvider } from './types';

/**
 * Tracks each individual provider's status by listening to emitted events
 * Maintains an overall "status" for the multi provider which represents the "most critical" status out of all providers
 */
export class StatusTracker {
  private readonly providerStatuses: Record<string, AllProviderStatus> = {};

  constructor(private events: ProviderEventEmitter<AllProviderEvents>) {}

  wrapEventHandler(providerEntry: RegisteredProvider) {
    const provider = providerEntry.provider;
    provider.events?.addHandler(AllProviderEvents.Error, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, AllProviderStatus.ERROR, details);
    });

    provider.events?.addHandler(AllProviderEvents.Stale, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, AllProviderStatus.STALE, details);
    });

    provider.events?.addHandler(AllProviderEvents.ConfigurationChanged, (details?: EventDetails) => {
      this.events.emit(AllProviderEvents.ConfigurationChanged, details);
    });

    provider.events?.addHandler(AllProviderEvents.Ready, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, AllProviderStatus.READY, details);
    });
  }

  providerStatus(name: string) {
    return this.providerStatuses[name];
  }

  private getStatusFromProviderStatuses() {
    const statuses = Object.values(this.providerStatuses);
    if (statuses.includes(AllProviderStatus.FATAL)) {
      return AllProviderStatus.FATAL;
    } else if (statuses.includes(AllProviderStatus.NOT_READY)) {
      return AllProviderStatus.NOT_READY;
    } else if (statuses.includes(AllProviderStatus.ERROR)) {
      return AllProviderStatus.ERROR;
    } else if (statuses.includes(AllProviderStatus.STALE)) {
      return AllProviderStatus.STALE;
    }
    return AllProviderStatus.READY;
  }

  private changeProviderStatus(name: string, status: AllProviderStatus, details?: EventDetails) {
    const currentStatus = this.getStatusFromProviderStatuses();
    this.providerStatuses[name] = status;
    const newStatus = this.getStatusFromProviderStatuses();
    if (currentStatus !== newStatus) {
      if (newStatus === AllProviderStatus.FATAL || newStatus === AllProviderStatus.ERROR) {
        this.events.emit(AllProviderEvents.Error, details);
      } else if (newStatus === AllProviderStatus.STALE) {
        this.events.emit(AllProviderEvents.Stale, details);
      } else if (newStatus === AllProviderStatus.READY) {
        this.events.emit(AllProviderEvents.Ready, details);
      }
    }
  }
}
