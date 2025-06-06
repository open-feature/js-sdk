import type { BaseHook, FlagValue } from '@openfeature/core';

export type Hook<TData = Record<string, unknown>> = BaseHook<FlagValue, TData, void, void>;
