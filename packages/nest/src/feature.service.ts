import { EvaluationContext } from '@openfeature/server-sdk';
import { ContextAsyncStorage } from './async-storage';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenFeatureContextService {
  constructor(private asyncLocalStorage: ContextAsyncStorage) {}

  public getContext(): EvaluationContext | undefined {
    return this.asyncLocalStorage.getStore()?.context;
  }
}
