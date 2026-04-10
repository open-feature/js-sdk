import type { Client } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import * as React from 'react';
import type { ReactFlagEvaluationOptions } from '../options';
import { Context } from '../internal';

type FrameworkMetadataClient = Client & {
  setFrameworkMetadata?: (framework: 'react') => Client;
};

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
export function OpenFeatureProvider({ client, domain, children, ...options }: ProviderProps) {
  const stableClient = React.useMemo(() => {
    if (client) {
      return setReactFrameworkMetadata(client);
    }

    return OpenFeature.getClient(domain, { framework: 'react' });
  }, [client, domain]);

  return <Context.Provider value={{ client: stableClient, options }}>{children}</Context.Provider>;
}

function setReactFrameworkMetadata(client: Client): Client {
  (client as FrameworkMetadataClient).setFrameworkMetadata?.('react');
  return client;
}
