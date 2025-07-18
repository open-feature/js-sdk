import type { ProviderMetadata } from '../provider';
import type { ClientMetadata } from '../client';
import type { EvaluationContext, FlagValue, FlagValueType } from '../evaluation';
import type { Logger } from '../logger';
import type { HookData } from './hook-data';

export type HookHints = Readonly<Record<string, unknown>>;

export interface HookContext<T extends FlagValue = FlagValue, TData = Record<string, unknown>> {
  readonly flagKey: string;
  readonly defaultValue: T;
  readonly flagValueType: FlagValueType;
  readonly context: Readonly<EvaluationContext>;
  readonly clientMetadata: ClientMetadata;
  readonly providerMetadata: ProviderMetadata;
  readonly logger: Logger;
  readonly hookData: HookData<TData>;
}

export interface BeforeHookContext<T extends FlagValue = FlagValue, TData = Record<string, unknown>> extends HookContext<T, TData> {
  context: EvaluationContext;
}
