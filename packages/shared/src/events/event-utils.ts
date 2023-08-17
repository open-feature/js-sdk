import { ProviderStatus } from '../provider';
import { ProviderEvents } from './events';

const eventStatusMap = {
    [ProviderStatus.READY]: ProviderEvents.Ready,
    [ProviderStatus.ERROR]: ProviderEvents.Error,
    [ProviderStatus.STALE]: ProviderEvents.Stale,
    [ProviderStatus.NOT_READY]: undefined,
};

/**
 * Returns true if the provider's status corresponds to the event.
 * If the provider's status is not defined, it matches READY.
 * 
 * @param event event to match
 * @param status status of provider
 * @returns boolean indicating if the provider status corresponds to the event.
 */
export const statusMatchesEvent = (event: ProviderEvents, status?: ProviderStatus): boolean => {
    return (!status && event === ProviderEvents.Ready) || eventStatusMap[status!] === event;
};