import { Client, OpenFeature } from '@openfeature/web-sdk';
import * as React from 'react';
import { ReactFlagEvaluationOptions } from '../common/options';
import { Context } from './context';

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

export function OpenFeatureProvider({ client, domain, children, ...options }: ProviderProps) {
  if (!client) {
    client = OpenFeature.getClient(domain);
  }

  return <Context.Provider value={{ client, options }}>{children}</Context.Provider>;
}
