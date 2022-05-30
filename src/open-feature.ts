import { OpenFeatureClient } from './client';
import { NOOP_PROVIDER } from './no-op-provider';
import { Client, EvaluationContext, EvaluationLifeCycle, FlagValue, Hook, Provider } from './types';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeature;
};
const _global = global as OpenFeatureGlobal;

export class OpenFeature implements EvaluationLifeCycle {
  private _provider: Provider = NOOP_PROVIDER;
  private _context: EvaluationContext = {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static get instance(): OpenFeature {
    const globalApi = _global[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeature();
    _global[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }

  getClient(name?: string, version?: string, context?: EvaluationContext): Client {
    return new OpenFeatureClient(this, { name, version }, context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addHooks(...hooks: Hook<FlagValue>[]): void {
    throw new Error('Method not implemented.');
  }

  get hooks(): Hook<FlagValue>[] {
    throw new Error('Method not implemented.');
  }

  set provider(provider: Provider) {
    this._provider = provider;
  }

  get provider(): Provider {
    return this._provider;
  }

  set context(context: EvaluationContext) {
    this._context = context;
  }

  get context(): EvaluationContext {
    return this._context;
  }
}
