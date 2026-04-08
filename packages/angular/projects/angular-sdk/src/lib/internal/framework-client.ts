import type { Client } from '@openfeature/web-sdk';

/**
 * Wraps a web client so Angular evaluations surface framework metadata.
 * @template {Client} T
 * @param {T} client client to wrap
 * @returns {T} framework-aware client proxy
 */
export function withAngularFrameworkMetadata<T extends Client>(client: T): T {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'metadata') {
        return {
          ...Reflect.get(target, property, receiver),
          framework: 'angular',
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
