import { OpenFeatureClient } from './client.js';
import { NOOP_PROVIDER } from './no-op-provider.js';
import { Client, EvaluationContext, FlagValue, Hook, Provider, TransformingProvider } from './types.js';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeature;
};
const _global = global as OpenFeatureGlobal;

// TODO: make implement EvaluationLifeCycle, but statically...
export class OpenFeature {
  private _provider: Provider = NOOP_PROVIDER;
  private _context: EvaluationContext = {};
  private _hooks: Hook[] = [];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  private static get instance(): OpenFeature {
    const globalApi = _global[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeature();
    _global[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }

  static getClient(name?: string, version?: string, context?: EvaluationContext): Client {
    return new OpenFeatureClient(
      () => this.instance._provider as TransformingProvider<unknown>,
      { name, version },
      context
    );
  }

  static get providerMetadata() {
    return this.instance._provider.metadata;
  }

  static addHooks(...hooks: Hook<FlagValue>[]): void {
    this.instance._hooks = [...this.instance._hooks, ...hooks];
  }

  static get hooks(): Hook<FlagValue>[] {
    return this.instance._hooks;
  }

  static setProvider(provider: Provider) {
    this.instance._provider = provider;
  }

  static set context(context: EvaluationContext) {
    this.instance._context = context;
  }

  static get context(): EvaluationContext {
    return this.instance._context;
  }

  static clearHooks(): void {
    this.instance._hooks = [];
  }
}
