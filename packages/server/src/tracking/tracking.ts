import { EvaluationContext, OccurrenceDetails } from '@openfeature/core';

export interface Tracking {

  /**
   * Track a thing
   * @param occurrenceKey
   * @param context
   * @param occurrenceDetails
   */
  track(occurrenceKey: string, context: EvaluationContext, occurrenceDetails: OccurrenceDetails): void;
}
