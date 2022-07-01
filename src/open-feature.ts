import { OpenFeatureClient } from './client.js';
import { NOOP_PROVIDER } from './no-op-provider.js';
import { Client, EvaluationContext, EvaluationLifeCycle, FlagValue, Hook, Provider, TransformingProvider } from './types.js';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeature;
};
const _global = global as OpenFeatureGlobal;

// TODO: make implement EvaluationLifeCycle, but statically...
export class OpenFeature implements EvaluationLifeCycle {
  private _provider: Provider = NOOP_PROVIDER;
  private _context: EvaluationContext = {};
  private _hooks: Hook[] = [];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  static getInstance(): OpenFeature {
    const globalApi = _global[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeature();
    _global[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }

  getClient(name?: string, version?: string, context?: EvaluationContext): Client {
    return new OpenFeatureClient(
      () => this._provider as TransformingProvider<unknown>,
      { name, version },
      context
    );
  }

  get providerMetadata() {
    return this._provider.metadata;
  }

  addHooks(...hooks: Hook<FlagValue>[]): void {
    this._hooks = [...this._hooks, ...hooks];
  }

  get hooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  setProvider(provider: Provider) {
    this._provider = provider;
  }

  set context(context: EvaluationContext) {
    this._context = context;
  }

  get context(): EvaluationContext {
    return this._context;
  }

  clearHooks(): void {
    this._hooks = [];
  }
}
