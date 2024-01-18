import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Provider } from '@openfeature/server-sdk';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  constructor(private readonly openFeatureProviders: Provider[]) {}

  async onApplicationShutdown() {
    await OpenFeature.close()
  }
}
