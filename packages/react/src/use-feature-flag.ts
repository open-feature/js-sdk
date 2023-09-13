import { Client, EvaluationDetails, FlagValue, ProviderEvents } from '@openfeature/web-sdk';
import { useEffect, useState } from 'react';
import { useOpenFeatureClient } from './provider';

export function useFeatureFlag<T extends FlagValue>(flagKey: string, defaultValue: T): EvaluationDetails<T> {
  const [, setForceUpdateState] = useState({});

  const client = useOpenFeatureClient();

  useEffect(() => {
    const forceUpdate = () => setForceUpdateState({});

    // adding handlers here means that an update is triggered, which leads to the change directly reflecting in the UI
    client.addHandler(ProviderEvents.Ready, forceUpdate);
    client.addHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    return () => {
      // be sure to cleanup the handlers
      client.removeHandler(ProviderEvents.Ready, forceUpdate);
      client.removeHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    };
  }, [client]);

  return getFlag(client, flagKey, defaultValue);
}

function getFlag<T extends FlagValue>(client: Client, flagKey: string, defaultValue: T): EvaluationDetails<T> {
  if (typeof defaultValue === 'boolean') {
    return client.getBooleanDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  } else if (typeof defaultValue === 'string') {
    return client.getStringDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  } else if (typeof defaultValue === 'number') {
    return client.getNumberDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  } else {
    return client.getObjectDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  }
}
