import type { PrimitiveValue } from '../types';

export type TrackingEventValue = PrimitiveValue | Date | { [key: string]: TrackingEventValue } | TrackingEventValue[];

/**
 * A container for arbitrary data that can relevant to tracking events.
 */
export type TrackingEventDetails = {
  /**
   * A numeric value associated with this event.
   */
  value?: number;
} & Record<string, TrackingEventValue>;
