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
   * A string uniquely identifying the subject (end-user, or client service) of a flag evaluation.
   * Providers may require this field for fractional flag evaluation, rules, or overrides targeting specific users.
   * Such providers may behave unpredictably if a targeting key is not specified at flag resolution.
   */
  value?: number;
} & Record<string, OccurrenceValue>;
