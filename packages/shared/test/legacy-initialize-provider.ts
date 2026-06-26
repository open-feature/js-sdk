import type { EvaluationContext, Paradigm } from '../src';

export interface LegacyInitializeProviderTracker {
  lastContext?: EvaluationContext;
  initializeCalls: number;
}

type LegacyInitializeProviderOptions = {
  runsOn: Paradigm;
  name?: string;
  /** When true, resolution stubs return promises (server SDK). Default false (web SDK). */
  asyncResolvers?: boolean;
};

type LegacyInitializeProviderResolvers = {
  resolveBooleanEvaluation: jest.Mock;
  resolveStringEvaluation: jest.Mock;
  resolveNumberEvaluation: jest.Mock;
  resolveObjectEvaluation: jest.Mock;
};

export type LegacyInitializeProvider = LegacyInitializeProviderTracker &
  LegacyInitializeProviderResolvers & {
    metadata: { name: string };
    runsOn: Paradigm;
    initialize: (context?: EvaluationContext) => Promise<void>;
  };

function createResolverStubs(asyncResolvers: boolean): LegacyInitializeProviderResolvers {
  if (asyncResolvers) {
    return {
      resolveBooleanEvaluation: jest.fn().mockResolvedValue({ value: false }),
      resolveStringEvaluation: jest.fn().mockResolvedValue({ value: '' }),
      resolveNumberEvaluation: jest.fn().mockResolvedValue({ value: 0 }),
      resolveObjectEvaluation: jest.fn().mockResolvedValue({ value: {} }),
    };
  }

  return {
    resolveBooleanEvaluation: jest.fn().mockReturnValue({ value: false }),
    resolveStringEvaluation: jest.fn().mockReturnValue({ value: '' }),
    resolveNumberEvaluation: jest.fn().mockReturnValue({ value: 0 }),
    resolveObjectEvaluation: jest.fn().mockReturnValue({ value: {} }),
  };
}

/**
 * Provider with a single-argument initialize that ignores any extra arguments passed by the SDK.
 */
export function legacyInitializeProvider(options: LegacyInitializeProviderOptions): LegacyInitializeProvider {
  const tracker: LegacyInitializeProviderTracker = {
    initializeCalls: 0,
  };

  return {
    metadata: { name: options.name ?? 'legacy-init' },
    runsOn: options.runsOn,
    get lastContext() {
      return tracker.lastContext;
    },
    get initializeCalls() {
      return tracker.initializeCalls;
    },
    async initialize(context?: EvaluationContext): Promise<void> {
      tracker.lastContext = context;
      tracker.initializeCalls++;
    },
    ...createResolverStubs(options.asyncResolvers ?? false),
  };
}

type LegacyInitTestProviderExtras = {
  events: unknown;
  hooks?: unknown[];
  track?: jest.Mock;
};

/**
 * Legacy initialize provider with the stubs MultiProvider expects on child providers.
 */
export function legacyInitTestProvider(
  options: LegacyInitializeProviderOptions,
  extras: LegacyInitTestProviderExtras,
): LegacyInitializeProvider & LegacyInitTestProviderExtras {
  return Object.assign(legacyInitializeProvider(options), {
    events: extras.events,
    hooks: extras.hooks ?? [],
    track: extras.track ?? jest.fn(),
  });
}
