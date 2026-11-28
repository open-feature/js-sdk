import { OpenFeatureError } from '../errors';
import type { EvaluationDetails, EvaluationContext, FlagValue } from '../evaluation';
import type { Logger } from '../logger';
import type { BaseHook } from './hook';
import type { BeforeHookContext, HookContext } from './hooks';

/**
 * Configuration options for {@link LoggingHook}.
 */
export interface LoggingHookOptions {
  /**
   * When `true`, includes the serialized `evaluation_context` in log output.
   * Defaults to `false` to avoid unintentionally logging sensitive context attributes.
   */
  includeEvaluationContext?: boolean;

  /**
   * Optional custom {@link Logger} override. When omitted, `hookContext.logger` is used.
   */
  logger?: Logger;
}

/**
 * Built-in hook that logs flag evaluation lifecycle stages (`before`, `after`, `error`)
 * in accordance with Appendix A of the OpenFeature specification.
 */
export class LoggingHook implements BaseHook<FlagValue, Record<string, unknown>, void, void> {
  private readonly includeEvaluationContext: boolean;
  private readonly logger?: Logger;

  constructor(options: LoggingHookOptions = {}) {
    this.includeEvaluationContext = options.includeEvaluationContext ?? false;
    this.logger = options.logger;
  }

  before(hookContext: BeforeHookContext): void {
    const logger = this.logger ?? hookContext.logger;
    logger.debug('Flag evaluation before stage', this.buildCommonPayload('before', hookContext));
  }

  after(hookContext: Readonly<HookContext>, evaluationDetails: EvaluationDetails<FlagValue>): void {
    const logger = this.logger ?? hookContext.logger;
    logger.debug('Flag evaluation after stage', {
      ...this.buildCommonPayload('after', hookContext),
      reason: evaluationDetails.reason,
      variant: evaluationDetails.variant,
      value: evaluationDetails.value,
    });
  }

  error(hookContext: Readonly<HookContext>, error: unknown): void {
    const logger = this.logger ?? hookContext.logger;
    const errorCode = error instanceof OpenFeatureError ? error.code : undefined;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Flag evaluation error stage', {
      ...this.buildCommonPayload('error', hookContext),
      error_code: errorCode,
      error_message: errorMessage,
    });
  }

  private buildCommonPayload(
    stage: 'before' | 'after' | 'error',
    hookContext: Readonly<HookContext>,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      stage,
      domain: hookContext.clientMetadata.domain,
      provider_name: hookContext.providerMetadata.name,
      flag_key: hookContext.flagKey,
      default_value: hookContext.defaultValue,
    };

    if (this.includeEvaluationContext) {
      payload.evaluation_context = serializeEvaluationContext(hookContext.context);
    }

    return payload;
  }
}

function serializeEvaluationContext(context: EvaluationContext): string {
  try {
    return JSON.stringify(context);
  } catch {
    return String(context);
  }
}
