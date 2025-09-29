/**
 * The attributes of an OpenTelemetry compliant event for flag evaluation.
 * @see https://opentelemetry.io/docs/specs/semconv/feature-flags/feature-flags-logs/
 */
export const TelemetryAttribute = {
  /**
   * The lookup key of the feature flag.
   *
   * - type: `string`
   * - requirement level: `required`
   * - example: `logo-color`
   */
  KEY: 'feature_flag.key',
  /**
   * Describes a class of error the operation ended with.
   *
   * - type: `string`
   * - requirement level: `conditionally required`
   * - condition: `reason` is `error`
   * - example: `flag_not_found`
   */
  ERROR_CODE: 'error.type',
  /**
   * A message explaining the nature of an error occurring during flag evaluation.
   *
   * - type: `string`
   * - requirement level: `recommended`
   * - example: `Flag not found`
   */
  ERROR_MESSAGE: 'error.message',
  /**
   * A semantic identifier for an evaluated flag value.
   *
   * - type: `string`
   * - requirement level: `conditionally required`
   * - condition: variant is defined on the evaluation details
   * - example: `blue`; `on`; `true`
   */
  VARIANT: 'feature_flag.result.variant',
  /**
   * The evaluated value of the feature flag.
   *
   * - type: `undefined`
   * - requirement level: `conditionally required`
   * - example: `#ff0000`; `1`; `true`
   */
  VALUE: 'feature_flag.result.value',
  /**
   * The unique identifier for the flag evaluation context. For example, the targeting key.
   *
   * - type: `string`
   * - requirement level: `recommended`
   * - example: `5157782b-2203-4c80-a857-dbbd5e7761db`
   */
  CONTEXT_ID: 'feature_flag.context.id',
  /**
   * The reason code which shows how a feature flag value was determined.
   *
   * - type: `string`
   * - requirement level: `recommended`
   * - example: `targeting_match`
   */
  REASON: 'feature_flag.result.reason',
  /**
   * Describes a class of error the operation ended with.
   *
   * - type: `string`
   * - requirement level: `recommended`
   * - example: `flag_not_found`
   */
  PROVIDER: 'feature_flag.provider.name',
  /**
   * The identifier of the flag set to which the feature flag belongs.
   *
   * - type: `string`
   * - requirement level: `recommended`
   * - example: `proj-1`; `ab98sgs`; `service1/dev`
   */
  FLAG_SET_ID: 'feature_flag.set.id',
  /**
   * The version of the ruleset used during the evaluation. This may be any stable value which uniquely identifies the ruleset.
   *
   * - type: `string`
   * - requirement level: `recommended`
   * - example: `1.0.0`; `2021-01-01`
   */
  VERSION: 'feature_flag.version',
} as const;
