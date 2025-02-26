import type { Client} from '@openfeature/web-sdk';
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
      client?: never;
    }
  | {
      /**
       * OpenFeature client to use.
       */
      client?: Client;
      domain?: never;
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
export function OpenFeatureProvider({ client, domain, children, ...options }: ProviderProps): JSX.Element {
  if (!client) {
    client = OpenFeature.getClient(domain);
  }

  return <Context.Provider value={{ client, options, domain }}>{children}</Context.Provider>;
}
