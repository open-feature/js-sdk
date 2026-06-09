import { TestBed } from '@angular/core/testing';
import { OpenFeature } from '@openfeature/web-sdk';
import { vi } from 'vitest';
import { TestingProvider } from '../test/test.utils';
import {
  OPEN_FEATURE_CONFIG_TOKEN,
  OpenFeatureModule,
  provideOpenFeature,
  OpenFeatureConfig,
} from './open-feature.module';

describe('provideOpenFeature', () => {
  let provider: TestingProvider;

  beforeEach(() => {
    provider = new TestingProvider(
      {
        testFlag: { variants: { on: true, off: false }, defaultVariant: 'on', disabled: false },
      },
      0,
    );
  });

  afterEach(async () => {
    await OpenFeature.close();
    await OpenFeature.setContext({});
    vi.restoreAllMocks();
  });

  it('registers OPEN_FEATURE_CONFIG_TOKEN with the original config object', () => {
    const config: OpenFeatureConfig = { provider };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    const token = TestBed.inject(OPEN_FEATURE_CONFIG_TOKEN);
    expect(token).toBe(config);
  });

  it('configures the default provider via OpenFeature.setProvider', () => {
    const spy = vi.spyOn(OpenFeature, 'setProvider');
    const config: OpenFeatureConfig = { provider };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    expect(spy).toHaveBeenCalledWith(provider, undefined);
  });

  it('configures domain-bound providers', () => {
    const domainProvider = new TestingProvider(
      { flag: { variants: { on: true }, defaultVariant: 'on', disabled: false } },
      0,
    );
    const spy = vi.spyOn(OpenFeature, 'setProvider');
    const config: OpenFeatureConfig = { provider, domainBoundProviders: { myDomain: domainProvider } };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    expect(spy).toHaveBeenCalledWith('myDomain', domainProvider, undefined);
  });

  it('passes static evaluation context to default and domain providers', () => {
    const domainProvider = new TestingProvider(
      { flag: { variants: { on: true }, defaultVariant: 'on', disabled: false } },
      0,
    );
    const context = { userId: 'abc123' };
    const spy = vi.spyOn(OpenFeature, 'setProvider');
    const config: OpenFeatureConfig = { provider, context, domainBoundProviders: { myDomain: domainProvider } };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    expect(spy).toHaveBeenCalledWith(provider, context);
    expect(spy).toHaveBeenCalledWith('myDomain', domainProvider, context);
  });

  it('invokes context factory exactly once and uses the resolved context everywhere', () => {
    const domainProvider = new TestingProvider(
      { flag: { variants: { on: true }, defaultVariant: 'on', disabled: false } },
      0,
    );
    const resolvedContext = { userId: 'factory-user' };
    const factory = vi.fn().mockReturnValue(resolvedContext);
    const spy = vi.spyOn(OpenFeature, 'setProvider');
    const config: OpenFeatureConfig = { provider, context: factory, domainBoundProviders: { d1: domainProvider } };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(provider, resolvedContext);
    expect(spy).toHaveBeenCalledWith('d1', domainProvider, resolvedContext);
  });

  it('uses the same context reference for all providers', () => {
    const domainProvider1 = new TestingProvider(
      { flag: { variants: { on: true }, defaultVariant: 'on', disabled: false } },
      0,
    );
    const domainProvider2 = new TestingProvider(
      { flag: { variants: { on: true }, defaultVariant: 'on', disabled: false } },
      0,
    );
    const resolvedContext = { userId: 'shared' };
    const factory = vi.fn().mockReturnValue(resolvedContext);
    const spy = vi.spyOn(OpenFeature, 'setProvider');
    const config: OpenFeatureConfig = {
      provider,
      context: factory,
      domainBoundProviders: { d1: domainProvider1, d2: domainProvider2 },
    };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    const calls = spy.mock.calls;
    const contexts = calls.map((c) => c[c.length - 1]);
    expect(contexts.every((ctx) => ctx === resolvedContext)).toBe(true);
  });

  it('OpenFeatureModule.forRoot() still works', () => {
    const config: OpenFeatureConfig = { provider };
    TestBed.configureTestingModule({
      imports: [OpenFeatureModule.forRoot(config)],
    });
    const token = TestBed.inject(OPEN_FEATURE_CONFIG_TOKEN);
    expect(token).toBe(config);
  });

  it('works when no domain-bound providers are specified', () => {
    const spy = vi.spyOn(OpenFeature, 'setProvider');
    const config: OpenFeatureConfig = { provider };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(provider, undefined);
  });

  it('works when context is omitted entirely', () => {
    const spy = vi.spyOn(OpenFeature, 'setProvider');
    const config: OpenFeatureConfig = { provider };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(config)],
    });
    expect(spy).toHaveBeenCalledWith(provider, undefined);
  });

  it('module and standalone paths produce the same OPEN_FEATURE_CONFIG_TOKEN', async () => {
    const configA: OpenFeatureConfig = { provider };
    TestBed.configureTestingModule({
      imports: [OpenFeatureModule.forRoot(configA)],
    });
    const tokenFromModule = TestBed.inject(OPEN_FEATURE_CONFIG_TOKEN);

    TestBed.resetTestingModule();
    await OpenFeature.close();

    const configB: OpenFeatureConfig = { provider };
    TestBed.configureTestingModule({
      providers: [provideOpenFeature(configB)],
    });
    const tokenFromStandalone = TestBed.inject(OPEN_FEATURE_CONFIG_TOKEN);

    expect(tokenFromModule).toBe(configA);
    expect(tokenFromStandalone).toBe(configB);
  });
});
