import { ProviderStatus } from '../provider';
import { AllProviderEvents, AnyProviderEvent } from './events';

const eventStatusMap = {
    [ProviderStatus.READY]: AllProviderEvents.Ready,
    [ProviderStatus.ERROR]: AllProviderEvents.Error,
    [ProviderStatus.STALE]: AllProviderEvents.Stale,
    [ProviderStatus.NOT_READY]: undefined,
};

/**
 * Returns true if the provider's status corresponds to the event.
 * If the provider's status is not defined, it matches READY.
 * @param {AnyProviderEvent} event event to match
 * @param {ProviderStatus} status  status of provider
 * @returns {boolean} boolean indicating if the provider status corresponds to the event.
 */
export const statusMatchesEvent = <T extends AnyProviderEvent>(event: T, status?: ProviderStatus): boolean => {
    return (!status && event === AllProviderEvents.Ready) || eventStatusMap[status!] === event;
};