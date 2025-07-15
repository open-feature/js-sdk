import type { EvaluationDetails, FlagValue, Hook, HookContext, HookHints, Logger } from '@openfeature/server-sdk';

/**
 * Utility for executing a set of hooks of each type. Implementation is largely copied from the main OpenFeature SDK.
 */
export class HookExecutor {
  constructor(private logger: Logger) {}

  async beforeHooks(hooks: Hook[] | undefined, hookContext: HookContext, hints: HookHints) {
    for (const hook of hooks ?? []) {
      // freeze the hookContext
      Object.freeze(hookContext);

      Object.assign(hookContext.context, {
        ...(await hook?.before?.(hookContext, Object.freeze(hints))),
      });
    }

    // after before hooks, freeze the EvaluationContext.
    return Object.freeze(hookContext.context);
  }

  async afterHooks(
    hooks: Hook[] | undefined,
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    hints: HookHints,
  ) {
    // run "after" hooks sequentially
    for (const hook of hooks ?? []) {
      await hook?.after?.(hookContext, evaluationDetails, hints);
    }
  }

  async errorHooks(hooks: Hook[] | undefined, hookContext: HookContext, err: unknown, hints: HookHints) {
    // run "error" hooks sequentially
    for (const hook of hooks ?? []) {
      try {
        await hook?.error?.(hookContext, err, hints);
      } catch (err) {
        this.logger.error(`Unhandled error during 'error' hook: ${err}`);
        if (err instanceof Error) {
          this.logger.error(err.stack);
        }
        this.logger.error((err as Error)?.stack);
      }
    }
  }

  async finallyHooks(
    hooks: Hook[] | undefined,
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    hints: HookHints,
  ) {
    // run "finally" hooks sequentially
    for (const hook of hooks ?? []) {
      try {
        await hook?.finally?.(hookContext, evaluationDetails, hints);
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
