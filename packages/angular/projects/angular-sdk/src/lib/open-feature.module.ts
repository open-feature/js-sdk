import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationContext, OpenFeature, Provider } from '@openfeature/web-sdk';

export type EvaluationContextFactory = () => EvaluationContext;

export interface OpenFeatureConfig {
  /**
   * The default provider to be used by OpenFeature.
   * If not provided, the provider can be set later using {@link OpenFeature.setProvider}
   * or {@link OpenFeature.setProviderAndWait}.
   */
  provider?: Provider;
  /**
   * A map of domain-bound providers to be registered with OpenFeature.
   * The key is the domain name, and the value is the provider instance.
   * Providers can also be registered later using {@link OpenFeature.setProvider}
   * or {@link OpenFeature.setProviderAndWait}.
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
    OpenFeature.setProvider(config.provider, context);

    if (config.domainBoundProviders) {
      Object.entries(config.domainBoundProviders).map(([domain, provider]) =>
        OpenFeature.setProvider(domain, provider, context),
      );
    }

    return {
      ngModule: OpenFeatureModule,
      providers: [{ provide: OPEN_FEATURE_CONFIG_TOKEN, useValue: config }],
    };
  }
}
