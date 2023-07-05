import { Hook } from './hook';
import { FlagValue } from '../evaluation';

export interface EvaluationLifeCycle<T> {
  /**
   * Adds hooks that will run during flag evaluations on this receiver.
   * Hooks are executed in the order they were registered. Adding additional hooks
   * will not remove existing hooks.
   * Hooks registered on the global API object run with all evaluations.
   * Hooks registered on the client run with all evaluations on that client.
   * @template T The type of the receiver
   * @param {Hook<FlagValue>[]} hooks A list of hooks that should always run
   * @returns {T} The receiver (this object)
   */
  addHooks(...hooks: Hook<FlagValue>[]): T;

  /**
   * Access all the hooks that are registered on this receiver.
   * @returns {Hook<FlagValue>[]} A list of the client hooks
   */
  getHooks(): Hook<FlagValue>[];

  /**
   * Clears all the hooks that are registered on this receiver.
   * @template T The type of the receiver
   * @returns {T} The receiver (this object)
   */
  clearHooks(): T;
}
