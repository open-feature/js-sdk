import { PrimitiveValue } from '../types';


export type OccurrenceValue =
  | PrimitiveValue
  | Date
  | { [key: string]: OccurrenceValue }
  | OccurrenceValue[];

/**
 * A container for arbitrary contextual data that can be used as a basis for dynamic evaluation
 */
export type OccurrenceDetails = {
  /**
   * A numeric value associated with this event.
   */
  value?: number;
} & Record<string, OccurrenceValue>;
