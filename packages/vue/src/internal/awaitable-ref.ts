import type { Ref } from 'vue';

export type AwaitableRef<T> = Ref<T> & PromiseLike<T>;
