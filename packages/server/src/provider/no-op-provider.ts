import { ResolutionDetails, JsonValue, ProviderStatus } from '@openfeature/core';
import { Provider } from './provider';

const REASON_NO_OP = 'No-op';

/**
 * The No-op provider is set by default, and simply always returns the default value.
 */
class NoopFeatureProvider implements Provider {
  readonly metadata = {
    name: 'No-op Provider',
  } as const;

  get status(): ProviderStatus {
    /**
     * This is due to the NoopProvider not being a real provider.
     * We do not want it to trigger the Ready event handlers, so we never set this to ready.
     * With the NoopProvider assigned, the client can be assumed to be uninitialized.
     * https://github.com/open-feature/js-sdk/pull/429#discussion_r1202642654
     */
    return ProviderStatus.NOT_READY;
  }

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
