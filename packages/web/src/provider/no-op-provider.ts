import type { JsonValue, ResolutionDetails } from '@openfeature/core';
import type { Provider } from './provider';

const REASON_NO_OP = 'No-op';

/**
 * The No-op provider is set by default, and simply always returns the default value.
 */
class NoopFeatureProvider implements Provider {
  readonly metadata = {
    name: 'No-op Provider',
  } as const;

  resolveBooleanEvaluation(_: string, defaultValue: boolean): ResolutionDetails<boolean> {
    return this.noOp(defaultValue);
  }

  resolveStringEvaluation(_: string, defaultValue: string): ResolutionDetails<string> {
    return this.noOp(defaultValue);
  }

  resolveNumberEvaluation(_: string, defaultValue: number): ResolutionDetails<number> {
    return this.noOp(defaultValue);
  }

  resolveObjectEvaluation<T extends JsonValue>(_: string, defaultValue: T): ResolutionDetails<T> {
    return this.noOp<T>(defaultValue);
  }

  private noOp<T>(defaultValue: T) {
    return {
      value: defaultValue,
      reason: REASON_NO_OP,
    };
  }
}

export const NOOP_PROVIDER = new NoopFeatureProvider();
