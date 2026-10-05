/**
 * A reactive box around a value.
 * Reading `current` inside a template, `$derived` or `$effect` registers a dependency,
 * so the consumer updates when the value changes.
 * Outside of effects, `current` simply returns the latest value.
 */
export interface ReactiveValue<T> {
  readonly current: T;
}
