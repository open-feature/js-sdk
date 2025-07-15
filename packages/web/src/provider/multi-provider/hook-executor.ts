import type { EvaluationDetails, FlagValue, Hook, HookContext, HookHints, Logger } from '@openfeature/web-sdk';

/**
 * Utility for executing a set of hooks of each type. Implementation is largely copied from the main OpenFeature SDK.
 */
export class HookExecutor {
  constructor(private logger: Logger) {}

  beforeHooks(hooks: Hook[] | undefined, hookContext: HookContext, hints: HookHints) {
    for (const hook of hooks ?? []) {
      hook?.before?.(hookContext, Object.freeze(hints));
    }
  }

  afterHooks(
    hooks: Hook[] | undefined,
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    hints: HookHints,
  ) {
    // run "after" hooks sequentially
    for (const hook of hooks ?? []) {
      hook?.after?.(hookContext, evaluationDetails, hints);
    }
  }

  errorHooks(hooks: Hook[] | undefined, hookContext: HookContext, err: unknown, hints: HookHints) {
    // run "error" hooks sequentially
    for (const hook of hooks ?? []) {
      try {
        hook?.error?.(hookContext, err, hints);
      } catch (err) {
        this.logger.error(`Unhandled error during 'error' hook: ${err}`);
        if (err instanceof Error) {
          this.logger.error(err.stack);
        }
        this.logger.error((err as Error)?.stack);
      }
    }
  }

  finallyHooks(
    hooks: Hook[] | undefined,
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    hints: HookHints,
  ) {
    // run "finally" hooks sequentially
    for (const hook of hooks ?? []) {
      try {
        hook?.finally?.(hookContext, evaluationDetails, hints);
      } catch (err) {
        this.logger.error(`Unhandled error during 'finally' hook: ${err}`);
        if (err instanceof Error) {
          this.logger.error(err.stack);
        }
        this.logger.error((err as Error)?.stack);
      }
    }
  }
}
