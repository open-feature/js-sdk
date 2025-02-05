/**
 * Well-known flag metadata attributes for telemetry events.
 * @see https://openfeature.dev/specification/appendix-d#flag-metadata
 */

/**
 * The context identifier returned in the flag metadata uniquely identifies
 * the subject of the flag evaluation. If not available, the targeting key
 * should be used.
 */
export const TELEMETRY_FLAG_METADATA_CONTEXT_ID = 'contextId';

/**
 * 	A logical identifier for the flag set.
 */
export const TELEMETRY_FLAG_METADATA_SET_ID = 'flagSetId';

/**
 * 	A version string (format unspecified) for the flag or flag set.
 */
export const TELEMETRY_FLAG_METADATA_VERSION = 'version';
