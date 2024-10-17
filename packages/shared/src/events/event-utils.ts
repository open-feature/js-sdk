import type { ClientProviderStatus, ServerProviderStatus } from '../provider';
import { AllProviderStatus } from '../provider';
import type { AnyProviderEvent } from './events';
import { AllProviderEvents } from './events';

const eventStatusMap = {
    [AllProviderStatus.READY]: AllProviderEvents.Ready,
    [AllProviderStatus.ERROR]: AllProviderEvents.Error,
    [AllProviderStatus.FATAL]: AllProviderEvents.Error,
    [AllProviderStatus.STALE]: AllProviderEvents.Stale,
    [AllProviderStatus.RECONCILING]: AllProviderEvents.Reconciling,
    [AllProviderStatus.NOT_READY]: undefined,
};

/**
 * Returns true if the provider's status corresponds to the event.
 * If the provider's status is not defined, it matches READY.
 * @param {AnyProviderEvent} event event to match
 * @param {ClientProviderStatus | ServerProviderStatus} status  status of provider
 * @returns {boolean} boolean indicating if the provider status corresponds to the event.
 */
export const statusMatchesEvent = <T extends AnyProviderEvent>(event: T, status?: ClientProviderStatus | ServerProviderStatus): boolean => {
    return (!status && event === AllProviderEvents.Ready) || eventStatusMap[status!] === event;
};