/**
 * Event data, sometimes referred as "body", is specific to a specific event.
 * In this case, the event is `feature_flag.evaluation`. That's why the prefix
 * is omitted from the values.
 * @see https://opentelemetry.io/docs/specs/semconv/feature-flags/feature-flags-logs/
 */

/**
 * The evaluated value of the feature flag.
 *
 * - type: `any`
 * - requirement level: `conditionally required`
 * - condition: `include if variant is not on the flag evaluation result`
 * - example: `#ff0000`; `1`; `true`
 */
export const TELEMETRY_EVAL_DATA_VALUE = 'value';
