export interface Logger {
  error(...args: unknown[]): void;

  warn(...args: unknown[]): void;

  info(...args: unknown[]): void;

  debug(...args: unknown[]): void;
}

export interface ManageLogger<T> {
  /**
   * Sets a logger on this receiver. This logger supersedes to the global logger
   * and is passed to various components in the SDK.
   * The logger configured on the global API object will be used for all evaluations,
   * unless overridden in a particular client.
   * @template T The type of the receiver
   * @param {Logger} logger The logger to be used
   * @returns {T} The receiver (this object)
   */
  setLogger(logger: Logger): T;
}
