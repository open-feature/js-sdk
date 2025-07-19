import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationContext, OpenFeature, Provider } from '@openfeature/web-sdk';

export type EvaluationContextFactory = () => EvaluationContext;

export interface OpenFeatureConfig {
  provider: Provider;
  domainBoundProviders?: Record<string, Provider>;
  context?: EvaluationContext | EvaluationContextFactory;
}

export const OPEN_FEATURE_CONFIG_TOKEN = new InjectionToken<OpenFeatureConfig>('OPEN_FEATURE_CONFIG_TOKEN');

@NgModule({
  declarations: [],
  imports: [CommonModule],
  exports: [],
})
export class OpenFeatureModule {
  static forRoot(config: OpenFeatureConfig): ModuleWithProviders<OpenFeatureModule> {
    const context = typeof config.context === 'function' ? config.context() : config.context;
    OpenFeature.setProvider(config.provider, context);

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
