import EventEmitter from 'events';
import { GenericEventEmitter, Logger, AllProviderEvents, ReadyEvent, AnyProviderEvent } from '../src';

// create concrete class to test the abstract functionality.
class TestEventEmitter extends GenericEventEmitter<AnyProviderEvent> {
  protected readonly eventEmitter = new EventEmitter({ captureRejections: true });

  constructor() {
    super();
    this.eventEmitter.on('error', (err) => {
      this._logger?.error('Error running event handler:', err);
    });
  }
}

/**
 * a little function to make sure we're at least waiting for the event loop 
 * to clear before we start making assertions
 */
const wait = (millis = 0) => {
  return new Promise(resolve => {setTimeout(resolve, millis);});
};

describe('GenericEventEmitter', () => {
  describe('addHandler should', function () {
    it('attach handler for event type', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.emit(AllProviderEvents.Ready);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(1);
    });

    it('attach several handlers for event type', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.addHandler(AllProviderEvents.Ready, handler2);
      emitter.addHandler(AllProviderEvents.Error, handler3);

      emitter.emit(AllProviderEvents.Ready);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).not.toHaveBeenCalled();
    });
  });

  describe('emit should', () => {
    it('call logger on error in event handler', function (done) {
      const logger: Logger = {
        info: () => done(),
        warn: () => done(),
        error: () => done(),
        debug: () => done(),
      };

      const emitter = new TestEventEmitter();
      emitter.setLogger(logger);

      emitter.addHandler(AllProviderEvents.Ready, async () => {
        throw Error();
      });
      emitter.emit(AllProviderEvents.Ready);
    });

    it('trigger handler for event type', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.emit(AllProviderEvents.Ready);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(1);
    });

    it('trigger handler for event type with event data', async function () {
      const event: ReadyEvent = { message: 'message' };
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.emit(AllProviderEvents.Ready, event);

      await wait();

      expect(handler1).toHaveBeenNthCalledWith(1, event);
    });

    it('trigger several handlers for event type', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.addHandler(AllProviderEvents.Ready, handler2);
      emitter.addHandler(AllProviderEvents.Error, handler3);

      emitter.emit(AllProviderEvents.Ready);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).not.toHaveBeenCalled();
    });
  });

  describe('removeHandler should', () => {
    it('remove single handler', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      emitter.addHandler(AllProviderEvents.Ready, handler1);

      emitter.emit(AllProviderEvents.Ready);
      emitter.removeHandler(AllProviderEvents.Ready, handler1);
      emitter.emit(AllProviderEvents.Ready);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeAllHandlers should', () => {
    it('remove all handlers for event type', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      const handler2 = jest.fn();
      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.addHandler(AllProviderEvents.Error, handler2);

      emitter.removeAllHandlers(AllProviderEvents.Ready);
      emitter.emit(AllProviderEvents.Ready);
      emitter.emit(AllProviderEvents.Error);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(0);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('remove same handler when assigned to multiple events', async function () {
      const emitter = new TestEventEmitter();

      const handler = jest.fn();
      emitter.addHandler(AllProviderEvents.Stale, handler);
      emitter.addHandler(AllProviderEvents.ContextChanged, handler);

      emitter.removeHandler(AllProviderEvents.Stale, handler);
      emitter.removeHandler(AllProviderEvents.ContextChanged, handler);

      emitter.emit(AllProviderEvents.Stale);
      emitter.emit(AllProviderEvents.ContextChanged);

      await wait();

      expect(handler).toHaveBeenCalledTimes(0);
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('remove all handlers only for event type', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      const handler2 = jest.fn();
      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.addHandler(AllProviderEvents.Error, handler2);

      emitter.emit(AllProviderEvents.Ready);
      emitter.removeAllHandlers(AllProviderEvents.Ready);
      emitter.emit(AllProviderEvents.Ready);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(0);
    });

    it('remove all handlers if no event type is given', async function () {
      const emitter = new TestEventEmitter();

      const handler1 = jest.fn();
      const handler2 = jest.fn();
      emitter.addHandler(AllProviderEvents.Ready, handler1);
      emitter.addHandler(AllProviderEvents.Error, handler2);

      emitter.emit(AllProviderEvents.Ready);
      emitter.emit(AllProviderEvents.Error);
      emitter.removeAllHandlers();
      emitter.emit(AllProviderEvents.Ready);
      emitter.emit(AllProviderEvents.Error);

      await wait();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });
});
