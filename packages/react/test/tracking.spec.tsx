import { jest } from '@jest/globals';
import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { render } from '@testing-library/react';
import * as React from 'react';
import type { Provider, TrackingEventDetails } from '../src';
import { OpenFeature, OpenFeatureProvider, useTrack } from '../src';

describe('tracking', () => {
  const eventName = 'test-tracking-event';
  const trackingValue = 1234;
  const trackingDetails: TrackingEventDetails = {
    value: trackingValue,
  };
  const domain = 'someDomain';

  const mockProvider = () => {
    const mockProvider: Provider = {
      metadata: {
        name: 'mock',
      },

      track: jest.fn((): void => {
        return;
      }),
    } as unknown as Provider;

    return mockProvider;
  };

  describe('no domain', () => {
    it('should call default provider', async () => {
      const provider = mockProvider();
      await OpenFeature.setProviderAndWait(provider);

      function Component() {
        const { track } = useTrack();
        track(eventName, trackingDetails);

        return <div></div>;
      }

      render(
        <OpenFeatureProvider suspend={false}>
          <Component></Component>
        </OpenFeatureProvider>,
      );

      expect(provider.track).toHaveBeenCalledWith(
        eventName,
        expect.anything(),
        expect.objectContaining({ value: trackingValue }),
      );
    });
  });

  describe('domain set', () => {
    it('should call provider for domain', async () => {
      const domainProvider = mockProvider();
      await OpenFeature.setProviderAndWait(domain, domainProvider);

      function Component() {
        const { track } = useTrack();
        track(eventName, trackingDetails);

        return <div></div>;
      }

      render(
        <OpenFeatureProvider domain={domain} suspend={false}>
          <Component></Component>
        </OpenFeatureProvider>,
      );

      expect(domainProvider.track).toHaveBeenCalledWith(
        eventName,
        expect.anything(),
        expect.objectContaining({ value: trackingValue }),
      );
    });
  });
});
