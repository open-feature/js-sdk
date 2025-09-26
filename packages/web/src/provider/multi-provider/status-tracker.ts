import type { EventDetails } from '@openfeature/core';
import type { OpenFeatureEventEmitter } from '../../events';
import { ProviderEvents } from '../../events';
import { ProviderStatus } from '../provider';
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
    provider.events?.addHandler(ProviderEvents.Error, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, ProviderStatus.ERROR, details);
    });

    provider.events?.addHandler(ProviderEvents.Stale, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, ProviderStatus.STALE, details);
    });

    provider.events?.addHandler(ProviderEvents.ConfigurationChanged, (details?: EventDetails) => {
      this.events.emit(ProviderEvents.ConfigurationChanged, details);
    });

    provider.events?.addHandler(ProviderEvents.Ready, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, ProviderStatus.READY, details);
    });

    provider.events?.addHandler(ProviderEvents.Reconciling, (details?: EventDetails) => {
      this.changeProviderStatus(providerEntry.name, ProviderStatus.RECONCILING, details);
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
    } else if (statuses.includes(ProviderStatus.RECONCILING)) {
      return ProviderStatus.RECONCILING;
    }
    return ProviderStatus.READY;
  }

  private changeProviderStatus(name: string, status: ProviderStatus, details?: EventDetails) {
    const currentStatus = this.getStatusFromProviderStatuses();
    this.providerStatuses[name] = status;
    const newStatus = this.getStatusFromProviderStatuses();
    if (currentStatus !== newStatus) {
      if (newStatus === ProviderStatus.FATAL || newStatus === ProviderStatus.ERROR) {
        this.events.emit(ProviderEvents.Error, details);
      } else if (newStatus === ProviderStatus.STALE) {
        this.events.emit(ProviderEvents.Stale, details);
      } else if (newStatus === ProviderStatus.READY) {
        this.events.emit(ProviderEvents.Ready, details);
      } else if (newStatus === ProviderStatus.RECONCILING) {
        this.events.emit(ProviderEvents.Reconciling, details);
      }
    }
  }
}
