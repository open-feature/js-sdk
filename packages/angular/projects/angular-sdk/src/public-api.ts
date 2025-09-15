/*
 * Public API Surface of angular
 */

export * from './lib/feature-flag.directive';
export * from './lib/feature-flag.service';
export * from './lib/open-feature.module';

// re-export the web-sdk so consumers can access that API from the angular-sdk
export * from '@openfeature/web-sdk';
