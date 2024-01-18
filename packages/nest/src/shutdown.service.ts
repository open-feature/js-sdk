import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Provider } from '@openfeature/server-sdk';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  constructor(private readonly openFeatureProviders: Provider[]) {}

  async onApplicationShutdown() {
    const closePromises: Array<Promise<void>> = [];
    for (const ofProvider of this.openFeatureProviders) {
      if (ofProvider.onClose) {
        closePromises.push(ofProvider.onClose());
      }
    }

    await Promise.all(closePromises);
  }
}
