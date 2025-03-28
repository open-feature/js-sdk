import { InMemoryProvider } from '@openfeature/server-sdk';
import type { ExecutionContext } from '@nestjs/common';
import { OpenFeatureModule } from '../src';

export const defaultProvider = new InMemoryProvider({
  testBooleanFlag: {
    defaultVariant: 'default',
    variants: { default: true },
    disabled: false,
  },
  testStringFlag: {
    defaultVariant: 'default',
    variants: { default: 'expected-string-value-default' },
    disabled: false,
  },
  testNumberFlag: {
    defaultVariant: 'default',
    variants: { default: 10 },
    disabled: false,
  },
  testObjectFlag: {
    defaultVariant: 'default',
    variants: { default: { client: 'default' } },
    disabled: false,
  },
});

export const providers = {
  domainScopedClient: new InMemoryProvider({
    testBooleanFlag: {
      defaultVariant: 'default',
      variants: { default: true },
      disabled: false,
    },
    testStringFlag: {
      defaultVariant: 'default',
      variants: { default: 'expected-string-value-scoped' },
      disabled: false,
    },
    testNumberFlag: {
      defaultVariant: 'default',
      variants: { default: 10 },
      disabled: false,
    },
    testObjectFlag: {
      defaultVariant: 'default',
      variants: { default: { client: 'scoped' } },
      disabled: false,
    },
  }),
};

export const exampleContextFactory = async (context: ExecutionContext) => {
  const request = await context.switchToHttp().getRequest();

  const userId = request.header('x-user-id');

  if (userId) {
    return {
      targetingKey: userId,
    };
  }

  return undefined;
};

export const getOpenFeatureDefaultTestModule = () => {
  return OpenFeatureModule.forRoot({
    contextFactory: exampleContextFactory,
    defaultProvider,
    providers,
  });
};
