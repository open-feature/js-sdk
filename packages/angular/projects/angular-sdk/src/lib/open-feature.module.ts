import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenFeature, Provider } from '@openfeature/web-sdk';
import {
  BooleanFeatureFlagDirective,
  NumberFeatureFlagDirective,
  ObjectFeatureFlagDirective,
  StringFeatureFlagDirective,
} from './feature-flag.directive';

export interface OpenFeatureConfig {
  provider: Provider;
  domainBoundProviders?: Record<string, Provider>;
}

export const OPEN_FEATURE_CONFIG_TOKEN = new InjectionToken<OpenFeatureConfig>('OPEN_FEATURE_CONFIG_TOKEN');

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [],
})
export class OpenFeatureModule {
  static forRoot(config: OpenFeatureConfig): ModuleWithProviders<OpenFeatureModule> {
    OpenFeature.setProvider(config.provider);
    if (config.domainBoundProviders) {
      Object.entries(config.domainBoundProviders).map(([domain, provider]) =>
        OpenFeature.setProvider(domain, provider),
      );
    }

    return {
      ngModule: OpenFeatureModule,
      providers: [{ provide: OPEN_FEATURE_CONFIG_TOKEN, useValue: config }],
    };
  }
}
