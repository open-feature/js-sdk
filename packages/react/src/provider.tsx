import * as React from 'react'
import { Client, OpenFeature } from '@openfeature/web-sdk'

type ProviderProps = {
  client?: Client
  children?: React.ReactNode
}

const Context = React.createContext<Client | undefined>(undefined)

export const OpenFeatureProvider = ({ client, children }: ProviderProps) => {
  if (!client) {
    client = OpenFeature.getClient()
  }

  return <Context.Provider value={client}>{children}</Context.Provider>
}

export const useOpenFeatureClient = () => {
  const client = React.useContext(Context)

  if (!client) {
    throw new Error(
      'No OpenFeature client available - components using OpenFeature must be wrapped with an <OpenFeatureProvider>'
    )
  }

  return client
}
