import type { OnApplicationShutdown } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { OpenFeature } from '@openfeature/server-sdk';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await OpenFeature.close();
  }
}
