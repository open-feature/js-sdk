import type { Ref } from 'vue';

export type AwaitableRef<T> = Readonly<Ref<T>> & PromiseLike<T>;
