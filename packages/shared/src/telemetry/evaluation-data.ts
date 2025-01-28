/**
 * Event data, sometimes referred as "body", is specific to a specific event.
 * In this case, the event is `feature_flag.evaluation`. That's why the prefix
 * is omitted from the values.
 * @see https://opentelemetry.io/docs/specs/semconv/feature-flags/feature-flags-logs/
 */
export const TELEMETRY_EVALUATION_DATA = {
  /**
   * The evaluated value of the feature flag.
   *
   * - type: `undefined`
   * - requirement level: `conditionally required`
   * - example: `#ff0000`; `1`; `true`
   */
  VALUE: 'value',
} as const;
