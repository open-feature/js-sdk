import { OccurrenceDetails } from '@openfeature/core';

export interface Tracking {

  /**
   * Track a thing
   * @param occurrenceKey
   * @param occurrenceDetails
   */
  track(occurrenceKey: string, occurrenceDetails: OccurrenceDetails): void;
}
