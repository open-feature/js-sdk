import type { Tracking, TrackingEventDetails } from '@openfeature/web-sdk';
import { useCallback } from 'react';
import { useOpenFeatureClient } from '../provider';

export type Track = {
  /**
   * Context-aware tracking function for the parent `<OpenFeatureProvider/>`.
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

  const track = useCallback((trackingEventName: string, trackingEventDetails?: TrackingEventDetails) => {
    client.track(trackingEventName, trackingEventDetails);
  }, []);

  return {
    track,
  };
}
