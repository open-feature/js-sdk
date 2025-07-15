import type { EventDetails, OpenFeatureEventEmitter } from '@openfeature/web-sdk';
import { ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
import type { RegisteredProvider } from './types';

/**
 * Tracks each individual provider's status by listening to emitted events
 * Maintains an overall "status" for the multi provider which represents the "most critical" status out of all providers
 */
export class StatusTracker {
  private readonly providerStatuses: Record<string, ProviderStatus> = {};

  constructor(private events: OpenFeatureEventEmitter) {}

  wrapEventHandler(providerEntry: RegisteredProvider) {
    const provider = providerEntry.provider;
    provider.events?.addHandler(ProviderEvents.Error, (details) => {
      this.changeProviderStatus(providerEntry.name, ProviderStatus.ERROR, details);
    });

    provider.events?.addHandler(ProviderEvents.Stale, (details) => {
      this.changeProviderStatus(providerEntry.name, ProviderStatus.STALE, details);
    });

    provider.events?.addHandler(ProviderEvents.ConfigurationChanged, (details) => {
      this.events.emit(ProviderEvents.ConfigurationChanged, details);
    });

    provider.events?.addHandler(ProviderEvents.Ready, (details) => {
      this.changeProviderStatus(providerEntry.name, ProviderStatus.READY, details);
    });
  }

  providerStatus(name: string) {
    return this.providerStatuses[name];
  }

  private getStatusFromProviderStatuses() {
    const statuses = Object.values(this.providerStatuses);
    if (statuses.includes(ProviderStatus.FATAL)) {
      return ProviderStatus.FATAL;
    } else if (statuses.includes(ProviderStatus.NOT_READY)) {
      return ProviderStatus.NOT_READY;
    } else if (statuses.includes(ProviderStatus.ERROR)) {
      return ProviderStatus.ERROR;
    } else if (statuses.includes(ProviderStatus.STALE)) {
      return ProviderStatus.STALE;
    }
    return ProviderStatus.READY;
  }

  private changeProviderStatus(name: string, status: ProviderStatus, details?: EventDetails) {
    const currentStatus = this.getStatusFromProviderStatuses();
    this.providerStatuses[name] = status;
    const newStatus = this.getStatusFromProviderStatuses();
    if (currentStatus !== newStatus) {
      if (newStatus === ProviderStatus.FATAL) {
        this.events.emit(ProviderEvents.Error, details);
      } else if (newStatus === ProviderStatus.ERROR) {
        this.events.emit(ProviderEvents.Error, details);
      } else if (newStatus === ProviderStatus.STALE) {
        this.events.emit(ProviderEvents.Stale, details);
      } else if (newStatus === ProviderStatus.READY) {
        this.events.emit(ProviderEvents.Ready, details);
      }
    }
  }
}
