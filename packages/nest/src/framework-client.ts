import type { Client } from '@openfeature/server-sdk';

/**
 * Wraps a server client so Nest evaluations surface framework metadata.
 * @template {Client} T
 * @param {T} client client to wrap
 * @returns {T} framework-aware client proxy
 */
export function withNestFrameworkMetadata<T extends Client>(client: T): T {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'metadata') {
        return {
          ...Reflect.get(target, property, receiver),
          framework: 'nest',
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
