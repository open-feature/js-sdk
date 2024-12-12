import type { OpenFeatureError } from '../errors';
import type { BaseHook } from './hook';
import type { BeforeHookContext, HookContext, HookHints } from './hooks';
import type { FlagValue, EvaluationDetails } from '../evaluation';

import { DefaultLogger, SafeLogger } from '../logger';

type LoggerPayload = Record<string, unknown>;

const DOMAIN_KEY = 'domain';
const PROVIDER_NAME_KEY = 'provider_name';
const FLAG_KEY_KEY = 'flag_key';
const DEFAULT_VALUE_KEY = 'default_value';
const EVALUATION_CONTEXT_KEY = 'evaluation_context';
const ERROR_CODE_KEY = 'error_code';
const ERROR_MESSAGE_KEY = 'error_message';
const REASON_KEY = 'reason';
const VARIANT_KEY = 'variant';
const VALUE_KEY = 'value';

export class LoggingHook implements BaseHook {
  readonly includeEvaluationContext: boolean = false;
  readonly logger = new SafeLogger(new DefaultLogger());

  constructor(includeEvaluationContext: boolean = false) {
    this.includeEvaluationContext = !!includeEvaluationContext;
  }

  before(hookContext: BeforeHookContext): void {
    const payload: LoggerPayload = { stage: 'before' };
    this.addCommonProps(payload, hookContext);
    this.logger.debug(payload);
  }

  after(hookContext: Readonly<HookContext<FlagValue>>, evaluationDetails: EvaluationDetails<FlagValue>): void {
    const payload: LoggerPayload = { stage: 'after' };

    payload[REASON_KEY] = evaluationDetails.reason;
    payload[VARIANT_KEY] = evaluationDetails.variant;
    payload[VALUE_KEY] = evaluationDetails.value;

    this.addCommonProps(payload, hookContext);
    this.logger.debug(payload);
  }

  error(hookContext: Readonly<HookContext<FlagValue>>, error: OpenFeatureError): void {
    const payload: LoggerPayload = { stage: 'error' };

    payload[ERROR_MESSAGE_KEY] = error.message;
    payload[ERROR_CODE_KEY] = error.code;

    this.addCommonProps(payload, hookContext);
    this.logger.error(payload);
  }

  finally(hookContext: Readonly<HookContext<FlagValue>>, hookHints?: HookHints): void {
    this.logger.info(hookContext, hookHints);
  }

  private addCommonProps(payload: LoggerPayload, hookContext: HookContext): void {
    payload[DOMAIN_KEY] = hookContext.clientMetadata.domain;
    payload[PROVIDER_NAME_KEY] = hookContext.providerMetadata.name;
    payload[FLAG_KEY_KEY] = hookContext.flagKey;
    payload[DEFAULT_VALUE_KEY] = hookContext.defaultValue;

    if (this.includeEvaluationContext) {
      payload[EVALUATION_CONTEXT_KEY] = hookContext.context;
    }
  }
}
