import {
  Client,
  EvaluationDetails,
  FlagValue,
  ProviderEvents,
  ResolutionDetails,
} from '@openfeature/web-sdk'
import { useEffect, useState } from 'react'
import { useOpenFeatureClient } from './provider'

export function useFeatureFlag<T extends FlagValue>(
  flagKey: string,
  defaultValue: T
): T {
  const [flagEvaluationDetails, setFlagEvaluationDetails] =
    useState<ResolutionDetails<T> | null>(null)

  const client = useOpenFeatureClient()

  useEffect(() => {
    getFlag(client, flagKey, defaultValue, setFlagEvaluationDetails);
    // adding handlers here mean that changes are immediately reflected in the UI when flags change
    client.addHandler(ProviderEvents.Ready, () => {
      getFlag(client, flagKey, defaultValue, setFlagEvaluationDetails);
    });
    client.addHandler(ProviderEvents.ConfigurationChanged, () => {
      getFlag(client, flagKey, defaultValue, setFlagEvaluationDetails);
    });
  }, [flagKey, defaultValue, client])

  if (flagEvaluationDetails) {
    return flagEvaluationDetails.value
  } else {
    return defaultValue
  }
}

async function getFlag<T extends FlagValue>(
  client: Client,
  flagKey: string,
  defaultValue: T,
  setFlagDetails: (details: EvaluationDetails<T>) => void
): Promise<void> {
  if (typeof defaultValue === 'boolean') {
    const flagDetails = await client.getBooleanDetails(flagKey, defaultValue)
    setFlagDetails(flagDetails as EvaluationDetails<T>)
  } else if (typeof defaultValue === 'string') {
    const flagDetails = await client.getStringDetails(flagKey, defaultValue)
    setFlagDetails(flagDetails as EvaluationDetails<T>)
  } else if (typeof defaultValue === 'number') {
    const flagDetails = await client.getNumberDetails(flagKey, defaultValue)
    setFlagDetails(flagDetails as EvaluationDetails<T>)
  } else {
    const flagDetails = await client.getObjectDetails(flagKey, defaultValue)
    setFlagDetails(flagDetails as EvaluationDetails<T>)
  }
}
