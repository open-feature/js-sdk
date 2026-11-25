import type { Ref } from 'vue';
import type { AwaitableRef } from './awaitable-ref';

export function makeAwaitableRef<T>(value: Ref<T>, getPromise: () => Promise<T>): AwaitableRef<T> {
  const then: PromiseLike<T>['then'] = (onFulfilled, onRejected) => getPromise().then(onFulfilled, onRejected);

  Object.defineProperty(value, 'then', {
    configurable: true,
    enumerable: false,
    value: then,
  });

  return value as AwaitableRef<T>;
}
