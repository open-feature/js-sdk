import type { TrackingEventDetails } from '@openfeature/core';

export interface Tracking {

  /**
   * Track a user action or application state, usually representing a business objective or outcome.
   * @param trackingEventName an identifier for the event
   * @param trackingEventDetails the details of the tracking event
   */
  track(trackingEventName: string, trackingEventDetails?: TrackingEventDetails): void;
}
