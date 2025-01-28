// https://openfeature.dev/specification/appendix-d#flag-metadata
export const TELEMETRY_FLAG_METADATA = {
  /**
   * The context identifier returned in the flag metadata uniquely identifies
   * the subject of the flag evaluation. If not available, the targeting key
   * should be used.
   */
  CONTEXT_ID: 'contextId',
  /**
   * 	A logical identifier for the flag set.
   */
  SET_ID: 'flagSetId',
  /**
   * 	A version string (format unspecified) for the flag or flag set.
   */
  VERSION: 'version',
} as const;
