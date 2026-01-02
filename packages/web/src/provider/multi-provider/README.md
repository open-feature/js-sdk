# OpenFeature Multi-Provider

The Multi-Provider allows you to use multiple underlying providers as sources of flag data for the OpenFeature web SDK.
When a flag is being evaluated, the Multi-Provider will consult each underlying provider it is managing in order to determine
the final result. Different evaluation strategies can be defined to control which providers get evaluated and which result is used.

The Multi-Provider is a powerful tool for performing migrations between flag providers, or combining multiple providers into a single
feature flagging interface. For example:

- _Migration_: When migrating between two providers, you can run both in parallel under a unified flagging interface. As flags are added to the
  new provider, the Multi-Provider will automatically find and return them, falling back to the old provider if the new provider does not have
- _Multiple Data Sources_: The Multi-Provider allows you to seamlessly combine many sources of flagging data, such as environment variables,
  local files, database values and SaaS hosted feature management systems.

## Usage

The Multi-Provider is initialized with an array of providers it should evaluate:

```typescript
import { MultiProvider } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';

const multiProvider = new MultiProvider([{ provider: new ProviderA() }, { provider: new ProviderB() }]);

await OpenFeature.setProviderAndWait(multiProvider);

const client = OpenFeature.getClient();

console.log('Evaluating flag');
console.log(client.getBooleanDetails('my-flag', false));
```

By default, the Multi-Provider will evaluate all underlying providers in order and return the first successful result. If a provider indicates
it does not have a flag (FLAG_NOT_FOUND error code), then it will be skipped and the next provider will be evaluated. If any provider throws
or returns an error result, the operation will fail and the error will be thrown. If no provider returns a successful result, the operation
will fail with a FLAG_NOT_FOUND error code.

To change this behaviour, a different "strategy" can be provided:

```typescript
import { MultiProvider, FirstSuccessfulStrategy } from '@openfeature/web-sdk';

const multiProvider = new MultiProvider(
  [{ provider: new ProviderA() }, { provider: new ProviderB() }],
  new FirstSuccessfulStrategy(),
);
```

## Strategies

The Multi-Provider comes with three strategies out of the box:

- `FirstMatchStrategy` (default): Evaluates all providers in order and returns the first successful result. Providers that indicate FLAG_NOT_FOUND error will be skipped and the next provider will be evaluated. Any other error will cause the operation to fail and the set of errors to be thrown.
- `FirstSuccessfulStrategy`: Evaluates all providers in order and returns the first successful result. Any error will cause that provider to be skipped.
  If no successful result is returned, the set of errors will be thrown.
- `ComparisonStrategy`: Evaluates all providers sequentially. If every provider returns a successful result with the same value, then that result is returned.
  Otherwise, the result returned by the configured "fallback provider" will be used. When values do not agree, an optional callback will be executed to notify
  you of the mismatch. This can be useful when migrating between providers that are expected to contain identical configuration. You can easily spot mismatches
  in configuration without affecting flag behaviour.

This strategy accepts several arguments during initialization:

```typescript
import { MultiProvider, ComparisonStrategy } from '@openfeature/web-sdk';

const providerA = new ProviderA();
const multiProvider = new MultiProvider(
  [{ provider: providerA }, { provider: new ProviderB() }],
  new ComparisonStrategy(providerA, (details) => {
    console.log('Mismatch detected', details);
  }),
);
```

The first argument is the "fallback provider" whose value to use in the event that providers do not agree. It should be the same object reference as one of the providers in the list. The second argument is a callback function that will be executed when a mismatch is detected. The callback will be passed an object containing the details of each provider's resolution, including the flag key, the value returned, and any errors that were thrown.

## Custom Strategies

It is also possible to implement your own strategy if the above options do not fit your use case. To do so, create a class which extends one of the built-in strategies or extends `BaseEvaluationStrategy` from `@openfeature/core`:

```typescript
import { FirstMatchStrategy } from '@openfeature/web-sdk';

class MyCustomStrategy extends FirstMatchStrategy {
  // Override methods as needed
  override shouldEvaluateThisProvider(
    strategyContext: StrategyPerProviderContext,
    evalContext: EvaluationContext,
  ): boolean {
    // Custom logic here
    return super.shouldEvaluateThisProvider(strategyContext, evalContext);
  }
}
```

The `BaseEvaluationStrategy` abstract class has the following structure:

```typescript
export abstract class BaseEvaluationStrategy {
  public runMode: 'parallel' | 'sequential' = 'sequential';

  shouldEvaluateThisProvider(strategyContext: StrategyPerProviderContext, evalContext: EvaluationContext): boolean;

  shouldEvaluateNextProvider<T extends FlagValue>(
    strategyContext: StrategyPerProviderContext,
    context: EvaluationContext,
    result: ProviderResolutionResult<T>,
  ): boolean;

  shouldTrackWithThisProvider(
    strategyContext: StrategyPerProviderContext,
    context: EvaluationContext,
    trackingEventName: string,
    trackingEventDetails: TrackingEventDetails,
  ): boolean;

  abstract determineFinalResult<T extends FlagValue>(
    strategyContext: StrategyEvaluationContext,
    context: EvaluationContext,
    resolutions: ProviderResolutionResult<T>[],
  ): FinalResult<T>;
}
```

The methods serve the following purposes:

- **`runMode`**: Property that determines whether providers are evaluated `'sequential'` (default) or `'parallel'`.

- **`shouldEvaluateThisProvider`**: Called before evaluating each provider. Return `false` to skip the provider. By default, skips providers in `NOT_READY` or `FATAL` status.

- **`shouldEvaluateNextProvider`**: Called after evaluating a provider (sequential mode only). Return `true` to continue to the next provider, `false` to stop.

- **`shouldTrackWithThisProvider`**: Called before sending a tracking event to each provider. Return `false` to skip tracking. By default, skips providers in `NOT_READY` or `FATAL` status.

- **`determineFinalResult`**: Called after all providers have been evaluated. Takes the list of provider results and returns the final resolution. This is the only abstract method that must be implemented by subclasses.

## Tracking Support

The Multi-Provider supports tracking events across multiple providers, allowing you to send analytics events to all configured providers simultaneously.

### Basic Tracking Usage

```typescript
import { MultiProvider } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';

const multiProvider = new MultiProvider([{ provider: new ProviderA() }, { provider: new ProviderB() }]);

await OpenFeature.setProviderAndWait(multiProvider);
const client = OpenFeature.getClient();

// Tracked events will be sent to all providers by default
client.track('user-conversion', {
  value: 99.99,
  currency: 'USD',
  conversionType: 'purchase',
});

client.track('page-view', {
  page: '/checkout',
  source: 'direct',
});
```

### Tracking Behavior

- **Default**: All providers receive tracking calls by default
- **Error Handling**: If one provider fails to track, others continue normally and errors are logged
- **Provider Status**: Providers in `NOT_READY` or `FATAL` status are automatically skipped
- **Optional Method**: Providers without a `track` method are gracefully skipped

### Customizing Tracking with Strategies

You can customize which providers receive tracking calls by overriding the `shouldTrackWithThisProvider` method in your custom strategy:

```typescript
import { FirstMatchStrategy, StrategyPerProviderContext } from '@openfeature/web-sdk';

class CustomTrackingStrategy extends FirstMatchStrategy {
  // Override tracking behavior
  override shouldTrackWithThisProvider(
    strategyContext: StrategyPerProviderContext,
    context: EvaluationContext,
    trackingEventName: string,
    trackingEventDetails: TrackingEventDetails,
  ): boolean {
    // Only track with the primary provider
    if (strategyContext.providerName === 'primary-provider') {
      return true;
    }

    // Skip tracking for analytics events on backup providers
    if (trackingEventName.startsWith('analytics.')) {
      return false;
    }

    return super.shouldTrackWithThisProvider(strategyContext, context, trackingEventName, trackingEventDetails);
  }
}
```
