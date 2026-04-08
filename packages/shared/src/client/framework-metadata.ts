import type { ClientMetadata } from './client';

/**
 * Wraps a client so framework metadata is visible through `metadata` and `this.metadata`.
 * @template T
 * @param {T} client client to wrap
 * @param {NonNullable<ClientMetadata['framework']>} framework framework metadata to expose
 * @returns {T} framework-aware client proxy
 */
export function withFrameworkMetadata<T extends object>(
  client: T,
  framework: NonNullable<ClientMetadata['framework']>,
): T {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'metadata') {
        return {
          ...(Reflect.get(target, property, receiver) ?? {}),
          framework,
        };
      }

      const value = Reflect.get(target, property, receiver);

      if (typeof value !== 'function') {
        return value;
      }

      return (...args: unknown[]) => {
        const result = value.apply(receiver, args);
        return result === target ? receiver : result;
      };
    },
  });
}
