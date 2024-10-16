import type { ProviderMetadata } from '../provider';
import type { ClientMetadata } from '../client';
import type { EvaluationContext, FlagValue, FlagValueType } from '../evaluation';
import type { Logger } from '../logger';

export type HookHints = Readonly<Record<string, unknown>>;

export interface HookContext<T extends FlagValue = FlagValue> {
  readonly flagKey: string;
  readonly defaultValue: T;
  readonly flagValueType: FlagValueType;
  readonly context: Readonly<EvaluationContext>;
  readonly clientMetadata: ClientMetadata;
  readonly providerMetadata: ProviderMetadata;
  readonly logger: Logger;
}

export interface BeforeHookContext extends HookContext {
  context: EvaluationContext;
}
