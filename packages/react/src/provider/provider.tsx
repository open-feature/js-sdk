import type { Client, OpenFeatureAPIBase } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import * as React from 'react';
import type { ReactFlagEvaluationOptions } from '../options';
import { Context } from '../internal';

type ClientOrDomain =
  | {
      /**
       * An identifier which logically binds clients with providers
       * @see OpenFeature.setProvider() and overloads.
       */
      domain?: string;
      /**
       * An isolated OpenFeature API instance to use instead of the global singleton.
       * Use this in micro-frontend architectures where different parts of the application
       * need isolated OpenFeature instances.
       * @see createIsolatedOpenFeatureAPI from '@openfeature/web-sdk/isolated'
       * @example
       * ```tsx
       * import { createIsolatedOpenFeatureAPI } from '@openfeature/web-sdk/isolated';
       *
       * const MyOpenFeature = createIsolatedOpenFeatureAPI();
       * MyOpenFeature.setProvider(myProvider);
       *
       * function App() {
       *   return (
       *     <OpenFeatureProvider openfeature={MyOpenFeature}>
       *       {children}
       *     </OpenFeatureProvider>
       *   );
       * }
       * ```
       */
      openfeature?: OpenFeatureAPIBase;
      client?: never;
    }
  | {
      /**
       * OpenFeature client to use.
       */
      client?: Client;
      domain?: never;
      openfeature?: never;
    };

type ProviderProps = {
  children?: React.ReactNode;
} & ClientOrDomain &
  ReactFlagEvaluationOptions;

/**
 * Provides a scope for evaluating feature flags by binding a client to all child components.
 * @param {ProviderProps} properties props for the context provider
 * @returns {OpenFeatureProvider} context provider
 */
export function OpenFeatureProvider({ client, domain, openfeature, children, ...options }: ProviderProps) {
  const stableClient = React.useMemo(
    () => client || (openfeature ?? OpenFeature).getClient(domain),
    [client, domain, openfeature],
  );

  return <Context.Provider value={{ client: stableClient, options }}>{children}</Context.Provider>;
}
