import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationContext, OpenFeature, Provider } from '@openfeature/web-sdk';

export type EvaluationContextFactory = () => EvaluationContext;

export interface OpenFeatureConfig {
  /**
   * The default provider to be used by OpenFeature.
   * If not provided, the provider can be set later using {@link OpenFeature.setProvider}
   */
  provider?: Provider;
  /**
   * A map of domain-bound providers to be registered with OpenFeature.
   * The key is the domain name, and the value is the provider instance.
   * Providers can also be registered later using {@link OpenFeature.setProvider}
   */
  domainBoundProviders?: Record<string, Provider>;

  /**
   * An optional evaluation context or a factory function that returns an {@link EvaluationContext}.
   * This context will be used as the context for all providers registered by the module.
   * If a factory function is provided, it will be invoked to obtain the context.
   * This allows for dynamic context generation at runtime.
   */
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
    if (config.provider) {
      OpenFeature.setProvider(config.provider, context).catch((err) => {
        console.error('Error setting default provider in OpenFeatureModule:', err);
      });
    }

    if (config.domainBoundProviders) {
      Object.entries(config.domainBoundProviders).forEach(([domain, provider]) =>
        OpenFeature.setProvider(domain, provider, context).catch((err) => {
          console.error(`Error setting provider for domain "${domain}" in OpenFeatureModule:`, err);
        }),
      );
    }

    return {
      ngModule: OpenFeatureModule,
      providers: [{ provide: OPEN_FEATURE_CONFIG_TOKEN, useValue: config }],
    };
  }
}
