import type { ComponentPublicInstance } from 'vue';

export type StableSlots<S extends Record<string, unknown>> = {
  readonly [K in keyof S]: S[K];
} & Record<string, unknown>;

export type StableComponent<P, S extends Record<string, unknown> = Record<string, never>> = new () => Omit<
  ComponentPublicInstance,
  '$props' | '$slots'
> & {
  $props: Readonly<P>;
  $slots: StableSlots<S>;
};
