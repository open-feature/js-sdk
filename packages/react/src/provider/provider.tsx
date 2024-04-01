import * as React from 'react';
import { Client, OpenFeature } from '@openfeature/web-sdk';

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
} & ClientOrDomain;

const Context = React.createContext<Client | undefined>(undefined);

export const OpenFeatureProvider = ({ client, domain, children }: ProviderProps) => {
  if (!client) {
    client = OpenFeature.getClient(domain);
  }

  return <Context.Provider value={client}>{children}</Context.Provider>;
};

export const useOpenFeatureClient = () => {
  const client = React.useContext(Context);

  if (!client) {
    throw new Error(
      'No OpenFeature client available - components using OpenFeature must be wrapped with an <OpenFeatureProvider>'
    );
  }

  return client;
};
