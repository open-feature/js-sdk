export type PrimitiveValue = null | boolean | string | number;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
/**
 * Represents a JSON node value.
 */
export type JsonValue = PrimitiveValue | JsonObject | JsonArray;
