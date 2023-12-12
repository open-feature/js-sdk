import { DynamicModule, Module, FactoryProvider as NestValueProvider } from '@nestjs/common';
import { Client, OpenFeature, Provider } from '@openfeature/server-sdk';

@Module({})
export class OpenFeatureModule {
  static forRoot(options: OpenFeatureModuleOptions): DynamicModule {
    const clientValueProviders: NestValueProvider<Client>[] = [];

    if (options.defaultProvider) {
      OpenFeature.setProvider(options.defaultProvider);
      clientValueProviders.push({
        provide: getOpenFeatureClientToken(),
        useFactory: () => OpenFeature.getClient(),
      });
    }

    if (options.providers) {
      Object.entries(options.providers).forEach(([name, provider]) => {
        OpenFeature.setProvider(name, provider);
        clientValueProviders.push({
          provide: getOpenFeatureClientToken(name),
          useFactory: () => OpenFeature.getClient(name),
        });
      });
    }

    return {
      global: true,
      module: OpenFeatureModule,
      providers: [...clientValueProviders],
      exports: [...clientValueProviders],
    };
  }
}

export interface OpenFeatureModuleOptions {
  defaultProvider?: Provider;
  providers?: {
    [providerName: string]: Provider;
  };
}

export function getOpenFeatureClientToken(name?: string): string {
  return name ? `OpenFeatureClient_${name}` : 'OpenFeatureClient_default';
}
