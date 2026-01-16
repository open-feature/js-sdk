import type { Client, OpenFeatureAPI } from '@openfeature/web-sdk';
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
       * An instance of the OpenFeature API to use.
       * @see OpenFeature.getIsolated for more details.
       */
      sdk?: OpenFeatureAPI;
      client?: never;
    }
  | {
      /**
       * OpenFeature client to use.
       */
      client?: Client;
      domain?: never;
      sdk?: never;
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
export function OpenFeatureProvider({ client, domain, sdk, children, ...options }: ProviderProps) {
  const stableClient = React.useMemo(() => client || (sdk ?? OpenFeature).getClient(domain), [client, domain]);

  return <Context.Provider value={{ client: stableClient, options }}>{children}</Context.Provider>;
}
