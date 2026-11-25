import type { Ref } from 'vue';
import type { AwaitableRef } from './awaitable-ref';

export function makeAwaitableRef<T>(value: Ref<T>, promise: Promise<T>): AwaitableRef<T> {
  Object.defineProperty(value, 'then', {
    configurable: true,
    enumerable: false,
    value: promise.then.bind(promise),
  });

  return value as AwaitableRef<T>;
}
