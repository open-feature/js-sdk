import { EventEmitter } from 'events';
// this must precede other exports
export { EventEmitter as OpenFeatureEventEmitter };
export * from './client';
export * from './no-op-provider';
export * from './open-feature';
export * from './types';
export * from '@openfeature/shared';