import type { EvaluationContext, Paradigm } from '../src';

type LegacyInitializeProviderOptions = {
  runsOn: Paradigm;
  name?: string;
  /** When true, resolution stubs return promises (server SDK). Default false (web SDK). */
  asyncResolvers?: boolean;
};

type LegacyInitializeProviderExtras = {
  events: unknown;
  hooks?: unknown[];
  track?: jest.Mock;
};

type LegacyInitializeProviderResolvers = {
  resolveBooleanEvaluation: jest.Mock;
  resolveStringEvaluation: jest.Mock;
  resolveNumberEvaluation: jest.Mock;
  resolveObjectEvaluation: jest.Mock;
};

export type LegacyInitializeProvider = LegacyInitializeProviderResolvers & {
  metadata: { name: string };
  runsOn: Paradigm;
  lastContext?: EvaluationContext;
  initializeCalls: number;
  initialize: (context?: EvaluationContext) => Promise<void>;
};

function createResolverStubs(asyncResolvers: boolean): LegacyInitializeProviderResolvers {
  const mockValue = asyncResolvers
    ? <T>(value: T) => jest.fn().mockResolvedValue(value)
    : <T>(value: T) => jest.fn().mockReturnValue(value);

  return {
    resolveBooleanEvaluation: mockValue({ value: false }),
    resolveStringEvaluation: mockValue({ value: '' }),
    resolveNumberEvaluation: mockValue({ value: 0 }),
    resolveObjectEvaluation: mockValue({ value: {} }),
  };
}

/**
 * Provider with a single-argument initialize that ignores any extra arguments passed by the SDK.
 * Pass optional extras when MultiProvider needs events, hooks, or track stubs on the child.
 * @param options provider configuration (paradigm, name, resolver mode)
 * @param extras optional MultiProvider child stubs (events, hooks, track)
 * @returns a single-argument-initialize provider
 */
export function legacyInitializeProvider(
  options: LegacyInitializeProviderOptions,
  extras?: LegacyInitializeProviderExtras,
): LegacyInitializeProvider {
  const provider: LegacyInitializeProvider = {
    metadata: { name: options.name ?? 'legacy-init' },
    runsOn: options.runsOn,
    lastContext: undefined,
    initializeCalls: 0,
    async initialize(context?: EvaluationContext): Promise<void> {
      this.lastContext = context;
      this.initializeCalls++;
    },
    ...createResolverStubs(options.asyncResolvers ?? false),
  };

  if (extras) {
    Object.assign(provider, {
      events: extras.events,
      hooks: extras.hooks ?? [],
      track: extras.track ?? jest.fn(),
    });
  }

  return provider;
}
