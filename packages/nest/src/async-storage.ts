import { AsyncLocalStorage } from 'async_hooks';
import { AsyncContextType } from './open-feature.module';

export type ContextAsyncStorage = AsyncLocalStorage<AsyncContextType>;
export const SharedAsyncLocalStorage = new AsyncLocalStorage<AsyncContextType>();
