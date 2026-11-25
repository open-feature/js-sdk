import type { Tracking } from '@openfeature/web-sdk';
import { useClientRef } from '../provider/use-open-feature-client';

export type Track = {
  track: Tracking['track'];
};

export function useTrack(): Track {
  const clientRef = useClientRef();
  const track: Tracking['track'] = (trackingEventName, trackingEventDetails) => {
    clientRef.value.track(trackingEventName, trackingEventDetails);
  };

  return { track };
}
