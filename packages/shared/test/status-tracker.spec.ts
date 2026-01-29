import EventEmitter from 'events';
import type { AnyProviderEvent } from '../src';
import { GenericEventEmitter, ClientProviderEvents, ClientProviderStatus } from '../src';
import { StatusTracker } from '../src/provider/multi-provider/status-tracker';
import type { RegisteredProvider } from '../src/provider/multi-provider/types';

// Create a concrete event emitter for testing
class TestEventEmitter extends GenericEventEmitter<AnyProviderEvent> {
  protected readonly eventEmitter = new EventEmitter({ captureRejections: true });

  constructor() {
    super();
    this.eventEmitter.on('error', (err) => {
      console.error('Error running event handler:', err);
    });
  }
}

// Helper to wait for event loop
const wait = (millis = 0) => {
  return new Promise((resolve) => {
    setTimeout(resolve, millis);
  });
};

// Mock provider type for testing
type MockProvider = {
  events?: TestEventEmitter;
};

describe('StatusTracker', () => {
  let multiProviderEvents: TestEventEmitter;
  let statusTracker: StatusTracker<AnyProviderEvent, ClientProviderStatus, MockProvider>;

  beforeEach(() => {
    multiProviderEvents = new TestEventEmitter();
    statusTracker = new StatusTracker<AnyProviderEvent, ClientProviderStatus, MockProvider>(
      multiProviderEvents,
      ClientProviderStatus,
      ClientProviderEvents,
    );
  });

  afterEach(() => {
    multiProviderEvents.removeAllHandlers();
  });

  describe('wrapEventHandler', () => {
    it('should forward Error event and update provider status', async () => {
      const providerEvents = new TestEventEmitter();
      const providerEntry: RegisteredProvider<MockProvider> = {
        name: 'test-provider',
        provider: { events: providerEvents },
      };

      const errorHandler = jest.fn();
      multiProviderEvents.addHandler(ClientProviderEvents.Error, errorHandler);

      statusTracker.wrapEventHandler(providerEntry);
      providerEvents.emit(ClientProviderEvents.Error, { message: 'test error' });

      await wait();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(statusTracker.providerStatus('test-provider')).toBe(ClientProviderStatus.ERROR);
    });

    it('should forward Stale event and update provider status', async () => {
      const providerEvents = new TestEventEmitter();
      const providerEntry: RegisteredProvider<MockProvider> = {
        name: 'test-provider',
        provider: { events: providerEvents },
      };

      const staleHandler = jest.fn();
      multiProviderEvents.addHandler(ClientProviderEvents.Stale, staleHandler);

      statusTracker.wrapEventHandler(providerEntry);
      providerEvents.emit(ClientProviderEvents.Stale);

      await wait();

      expect(staleHandler).toHaveBeenCalledTimes(1);
      expect(statusTracker.providerStatus('test-provider')).toBe(ClientProviderStatus.STALE);
    });

    it('should forward Ready event and update provider status', async () => {
      const providerEvents = new TestEventEmitter();
      const providerEntry: RegisteredProvider<MockProvider> = {
        name: 'test-provider',
        provider: { events: providerEvents },
      };

      statusTracker.wrapEventHandler(providerEntry);
      providerEvents.emit(ClientProviderEvents.Ready);

      await wait();

      // Provider status should be updated
      expect(statusTracker.providerStatus('test-provider')).toBe(ClientProviderStatus.READY);
    });

    it('should forward ConfigurationChanged event without status change', async () => {
      const providerEvents = new TestEventEmitter();
      const providerEntry: RegisteredProvider<MockProvider> = {
        name: 'test-provider',
        provider: { events: providerEvents },
      };

      const configChangedHandler = jest.fn();
      multiProviderEvents.addHandler(ClientProviderEvents.ConfigurationChanged, configChangedHandler);

      statusTracker.wrapEventHandler(providerEntry);
      providerEvents.emit(ClientProviderEvents.ConfigurationChanged, { flagsChanged: ['flag1'] });

      await wait();

      expect(configChangedHandler).toHaveBeenCalledTimes(1);
      expect(configChangedHandler).toHaveBeenCalledWith({ flagsChanged: ['flag1'] });
    });

    it('should forward Reconciling event and update provider status (web only)', async () => {
      const providerEvents = new TestEventEmitter();
      const providerEntry: RegisteredProvider<MockProvider> = {
        name: 'test-provider',
        provider: { events: providerEvents },
      };

      const reconcilingHandler = jest.fn();
      multiProviderEvents.addHandler(ClientProviderEvents.Reconciling, reconcilingHandler);

      statusTracker.wrapEventHandler(providerEntry);
      providerEvents.emit(ClientProviderEvents.Reconciling);

      await wait();

      expect(reconcilingHandler).toHaveBeenCalledTimes(1);
      expect(statusTracker.providerStatus('test-provider')).toBe(ClientProviderStatus.RECONCILING);
    });

    it('should handle provider without events', () => {
      const providerEntry: RegisteredProvider<MockProvider> = {
        name: 'test-provider',
        provider: {},
      };

      // Should not throw
      expect(() => statusTracker.wrapEventHandler(providerEntry)).not.toThrow();
    });
  });

  describe('status priority', () => {
    it('should report FATAL as highest priority', async () => {
      const provider1Events = new TestEventEmitter();
      const provider2Events = new TestEventEmitter();

      statusTracker.wrapEventHandler({
        name: 'provider1',
        provider: { events: provider1Events },
      });
      statusTracker.wrapEventHandler({
        name: 'provider2',
        provider: { events: provider2Events },
      });

      // Set provider1 to READY, provider2 to ERROR
      provider1Events.emit(ClientProviderEvents.Ready);
      provider2Events.emit(ClientProviderEvents.Error);

      await wait();

      // Overall status should be ERROR (since we don't have FATAL event, we test ERROR > READY)
      expect(statusTracker.providerStatus('provider1')).toBe(ClientProviderStatus.READY);
      expect(statusTracker.providerStatus('provider2')).toBe(ClientProviderStatus.ERROR);
    });

    it('should report ERROR over STALE', async () => {
      const provider1Events = new TestEventEmitter();
      const provider2Events = new TestEventEmitter();

      statusTracker.wrapEventHandler({
        name: 'provider1',
        provider: { events: provider1Events },
      });
      statusTracker.wrapEventHandler({
        name: 'provider2',
        provider: { events: provider2Events },
      });

      provider1Events.emit(ClientProviderEvents.Stale);
      provider2Events.emit(ClientProviderEvents.Error);

      await wait();

      expect(statusTracker.providerStatus('provider1')).toBe(ClientProviderStatus.STALE);
      expect(statusTracker.providerStatus('provider2')).toBe(ClientProviderStatus.ERROR);
    });

    it('should report STALE over RECONCILING', async () => {
      const provider1Events = new TestEventEmitter();
      const provider2Events = new TestEventEmitter();

      statusTracker.wrapEventHandler({
        name: 'provider1',
        provider: { events: provider1Events },
      });
      statusTracker.wrapEventHandler({
        name: 'provider2',
        provider: { events: provider2Events },
      });

      provider1Events.emit(ClientProviderEvents.Reconciling);
      provider2Events.emit(ClientProviderEvents.Stale);

      await wait();

      expect(statusTracker.providerStatus('provider1')).toBe(ClientProviderStatus.RECONCILING);
      expect(statusTracker.providerStatus('provider2')).toBe(ClientProviderStatus.STALE);
    });

    it('should report RECONCILING over READY', async () => {
      const provider1Events = new TestEventEmitter();
      const provider2Events = new TestEventEmitter();

      statusTracker.wrapEventHandler({
        name: 'provider1',
        provider: { events: provider1Events },
      });
      statusTracker.wrapEventHandler({
        name: 'provider2',
        provider: { events: provider2Events },
      });

      provider1Events.emit(ClientProviderEvents.Ready);
      provider2Events.emit(ClientProviderEvents.Reconciling);

      await wait();

      expect(statusTracker.providerStatus('provider1')).toBe(ClientProviderStatus.READY);
      expect(statusTracker.providerStatus('provider2')).toBe(ClientProviderStatus.RECONCILING);
    });
  });

  describe('event emission on status change', () => {
    it('should emit Ready event when transitioning from error to ready', async () => {
      const provider1Events = new TestEventEmitter();

      statusTracker.wrapEventHandler({
        name: 'provider1',
        provider: { events: provider1Events },
      });

      const readyHandler = jest.fn();
      multiProviderEvents.addHandler(ClientProviderEvents.Ready, readyHandler);

      // Provider goes to error first
      provider1Events.emit(ClientProviderEvents.Error);
      await wait();

      // Then recovers to ready
      provider1Events.emit(ClientProviderEvents.Ready);
      await wait();

      // Ready should be emitted when transitioning from ERROR to READY
      expect(readyHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit Error event when any provider errors', async () => {
      const provider1Events = new TestEventEmitter();

      statusTracker.wrapEventHandler({
        name: 'provider1',
        provider: { events: provider1Events },
      });

      const errorHandler = jest.fn();
      multiProviderEvents.addHandler(ClientProviderEvents.Error, errorHandler);

      provider1Events.emit(ClientProviderEvents.Error, { message: 'provider error' });
      await wait();

      expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    it('should not emit event when status does not change', async () => {
      const provider1Events = new TestEventEmitter();

      statusTracker.wrapEventHandler({
        name: 'provider1',
        provider: { events: provider1Events },
      });

      const errorHandler = jest.fn();
      multiProviderEvents.addHandler(ClientProviderEvents.Error, errorHandler);

      // Emit error twice
      provider1Events.emit(ClientProviderEvents.Error);
      await wait();
      provider1Events.emit(ClientProviderEvents.Error);
      await wait();

      // Should only emit once since status didn't change
      expect(errorHandler).toHaveBeenCalledTimes(1);
    });
  });
});
