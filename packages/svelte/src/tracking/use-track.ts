import type { Tracking, TrackingEventDetails } from '@openfeature/web-sdk';
import { useOpenFeatureClient } from '../provider/use-open-feature-client';

export type Track = {
  /**
   * Context-aware tracking function for the enclosing scope (see `setOpenFeatureScope`).
   * Track a user action or application state, usually representing a business objective or outcome.
   * @param trackingEventName an identifier for the event
   * @param trackingEventDetails the details of the tracking event
   */
  track: Tracking['track'];
};

/**
 * Get a context-aware tracking function.
 * @returns {Track} context-aware tracking
 */
export function useTrack(): Track {
  const client = useOpenFeatureClient();

  const track = (trackingEventName: string, trackingEventDetails?: TrackingEventDetails) => {
    client.track(trackingEventName, trackingEventDetails);
  };

  return {
    track,
  };
}
