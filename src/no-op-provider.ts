import { JsonValue, Provider, ResolutionDetails } from './types';

const REASON_NO_OP = 'No-op';

/**
 * The No-op provider is set by default, and simply always returns the default value.
 */
class NoopFeatureProvider implements Provider {
  readonly metadata = {
    name: 'No-op Provider',
  } as const;

  resolveBooleanEvaluation(_: string, defaultValue: boolean): Promise<ResolutionDetails<boolean>> {
    return this.noOp(defaultValue);
  }

  resolveStringEvaluation(_: string, defaultValue: string): Promise<ResolutionDetails<string>> {
    return this.noOp(defaultValue);
  }

  resolveNumberEvaluation(_: string, defaultValue: number): Promise<ResolutionDetails<number>> {
    return this.noOp(defaultValue);
  }

  resolveObjectEvaluation<T extends JsonValue>(_: string, defaultValue: T): Promise<ResolutionDetails<T>> {
    return this.noOp<T>(defaultValue);
  }

  private noOp<T>(defaultValue: T) {
    return Promise.resolve({
      value: defaultValue,
      reason: REASON_NO_OP,
    });
  }
}

export const NOOP_PROVIDER = new NoopFeatureProvider();
