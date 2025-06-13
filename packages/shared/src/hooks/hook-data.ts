/**
 * A mutable data structure for hooks to maintain state across their lifecycle.
 * Each hook instance gets its own isolated data store that persists for the 
 * duration of a single flag evaluation.
 * @template TData - A record type that defines the shape of the stored data
 */
export interface HookData<TData = Record<string, unknown>> {
  /**
   * Sets a value in the hook data store.
   * @param key The key to store the value under
   * @param value The value to store
   */
  set<K extends keyof TData>(key: K, value: TData[K]): void;
  set(key: string, value: unknown): void;

  /**
   * Gets a value from the hook data store.
   * @param key The key to retrieve the value for
   * @returns The stored value, or undefined if not found
   */
  get<K extends keyof TData>(key: K): TData[K] | undefined;
  get(key: string): unknown;

  /**
   * Checks if a key exists in the hook data store.
   * @param key The key to check
   * @returns True if the key exists, false otherwise
   */
  has<K extends keyof TData>(key: K): boolean;
  has(key: string): boolean;

  /**
   * Deletes a value from the hook data store.
   * @param key The key to delete
   * @returns True if the key was deleted, false if it didn't exist
   */
  delete<K extends keyof TData>(key: K): boolean;
  delete(key: string): boolean;

  /**
   * Clears all values from the hook data store.
   */
  clear(): void;
}

/**
 * Default implementation of HookData using a Map.
 * @template TData - A record type that defines the shape of the stored data
 */
export class DefaultHookData<TData = Record<string, unknown>> implements HookData<TData> {
  private readonly data = new Map<keyof TData, TData[keyof TData]>();

  set<K extends keyof TData>(key: K, value: TData[K]): void {
    this.data.set(key, value);
  }

  get<K extends keyof TData>(key: K): TData[K] | undefined {
    return this.data.get(key) as TData[K] | undefined;
  }

  has<K extends keyof TData>(key: K): boolean {
    return this.data.has(key);
  }

  delete<K extends keyof TData>(key: K): boolean {
    return this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}