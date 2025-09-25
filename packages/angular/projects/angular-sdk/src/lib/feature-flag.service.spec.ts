import { TestBed } from '@angular/core/testing';
import { Component, inject } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { firstValueFrom, map } from 'rxjs';
import { JsonValue, OpenFeature, ResolutionDetails } from '@openfeature/web-sdk';
import { FeatureFlagService } from './feature-flag.service';
import { AsyncPipe } from '@angular/common';
import { TestingProvider } from '../test/test.utils';
import { OpenFeatureModule } from './open-feature.module';
import { toSignal } from '@angular/core/rxjs-interop';

const FLAG_KEY = 'thumbs';

@Component({
  selector: 'test',
  template: `
    <div data-testid="value">{{ (thumbs$ | async).value ? '👍' : '👎' }}</div>
    <div data-testid="reason">reason: {{ (thumbs$ | async).reason }}</div>
  `,
  standalone: true,
  imports: [AsyncPipe],
})
class TestComponent {
  private flagService = inject(FeatureFlagService);
  thumbs$ = this.flagService.getBooleanDetails(FLAG_KEY, false);
}

@Component({
  selector: 'test-signal',
  template: `
    <div data-testid="value">{{ thumbs().value ? '👍' : '👎' }}</div>
    <div data-testid="reason">reason: {{ thumbs().reason }}</div>
  `,
  standalone: true,
})
class TestComponentWithSignal {
  private flagService = inject(FeatureFlagService);
  thumbs = toSignal(this.flagService.getBooleanDetails(FLAG_KEY, false));
}

@Component({
  selector: 'config-change-disabled',
  template: `
    <div data-testid="value">{{ (thumbs$ | async).value ? '👍' : '👎' }}</div>
    <div data-testid="reason">reason: {{ (thumbs$ | async).reason }}</div>
  `,
  standalone: true,
  imports: [AsyncPipe],
})
class ConfigChangeDisabledComponent {
  private flagService = inject(FeatureFlagService);
  thumbs$ = this.flagService.getBooleanDetails(FLAG_KEY, false, undefined, { updateOnConfigurationChanged: false });
}

@Component({
  selector: 'context-change-disabled',
  template: `
    <div data-testid="value">{{ (thumbs$ | async).value ? '👍' : '👎' }}</div>
    <div data-testid="reason">reason: {{ (thumbs$ | async).reason }}</div>
  `,
  standalone: true,
  imports: [AsyncPipe],
})
class ContextChangeDisabledComponent {
  private flagService = inject(FeatureFlagService);
  thumbs$ = this.flagService.getBooleanDetails(FLAG_KEY, false, undefined, { updateOnContextChanged: false });
}

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let currentProvider: TestingProvider;
  let currentTestComponentFixture: ComponentFixture<TestComponent>;
  let currentTestComponentWithSignalFixture: ComponentFixture<TestComponentWithSignal>;
  let currentConfigChangeDisabledComponentFixture: ComponentFixture<ConfigChangeDisabledComponent>;
  let currentContextChangeDisabledComponentFixture: ComponentFixture<ContextChangeDisabledComponent>;

  async function createTestingModule(config?: {
    flagConfiguration?: ConstructorParameters<typeof TestingProvider>[0];
    providerInitDelay?: number;
  }) {
    const defaultFlagConfig = {
      [FLAG_KEY]: {
        variants: { default: true },
        defaultVariant: 'default',
        disabled: false,
      },
    };
    currentProvider = new TestingProvider(
      config?.flagConfiguration ?? defaultFlagConfig,
      config?.providerInitDelay ?? 0,
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OpenFeatureModule.forRoot({ provider: currentProvider })],
      providers: [FeatureFlagService],
    });

    currentTestComponentFixture?.destroy();
    currentTestComponentFixture = TestBed.createComponent(TestComponent);
    currentTestComponentFixture.detectChanges();

    currentTestComponentWithSignalFixture?.destroy();
    currentTestComponentWithSignalFixture = TestBed.createComponent(TestComponentWithSignal);
    currentTestComponentWithSignalFixture.detectChanges();

    currentContextChangeDisabledComponentFixture?.destroy();
    currentContextChangeDisabledComponentFixture = TestBed.createComponent(ContextChangeDisabledComponent);
    currentContextChangeDisabledComponentFixture.detectChanges();

    currentConfigChangeDisabledComponentFixture?.destroy();
    currentConfigChangeDisabledComponentFixture = TestBed.createComponent(ConfigChangeDisabledComponent);
    currentConfigChangeDisabledComponentFixture.detectChanges();
  }

  afterEach(async () => {
    await OpenFeature.close();
    await OpenFeature.setContext({});
    currentTestComponentFixture?.destroy();
    currentContextChangeDisabledComponentFixture?.destroy();
    currentConfigChangeDisabledComponentFixture?.destroy();
  });

  it('should show value based on feature flag', async () => {
    await createTestingModule();
    service = TestBed.inject(FeatureFlagService);

    currentTestComponentFixture.detectChanges();
    const observableValue = currentTestComponentFixture.nativeElement.querySelector('[data-testid="value"]');
    expect(observableValue?.textContent).toBe('👍');
  });

  it('should render updated value after delay', async () => {
    const delay = 50;
    await createTestingModule({ providerInitDelay: delay });

    let valueElement = currentTestComponentFixture.nativeElement.querySelector('[data-testid="value"]');
    expect(valueElement?.textContent).toBe('👎');

    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    currentTestComponentFixture.detectChanges();

    valueElement = currentTestComponentFixture.nativeElement.querySelector('[data-testid="value"]');
    expect(valueElement?.textContent).toBe('👍');
  });

  it('should render updated value after delay with signal', async () => {
    const delay = 50;
    await createTestingModule({ providerInitDelay: delay });

    let valueElement = currentTestComponentWithSignalFixture.nativeElement.querySelector('[data-testid="value"]');
    expect(valueElement?.textContent).toBe('👎');

    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    currentTestComponentWithSignalFixture.detectChanges();

    valueElement = currentTestComponentWithSignalFixture.nativeElement.querySelector('[data-testid="value"]');
    expect(valueElement?.textContent).toBe('👍');
  });

  describe('context changes', () => {
    it('should update when context changes', async () => {
      await createTestingModule({
        flagConfiguration: {
          [FLAG_KEY]: {
            variants: { default: false, premium: true },
            defaultVariant: 'default',
            disabled: false,
            contextEvaluator: (context) => (context['userType'] === 'premium' ? 'premium' : 'default'),
          },
        },
      });

      // Initially should show default
      let valueElement = currentTestComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👎');

      // Change context
      await OpenFeature.setContext({ userType: 'premium' });
      currentTestComponentFixture.detectChanges();

      // Should now show premium value
      valueElement = currentTestComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👍');
    });

    it('should not update when context changes and updateOnContextChanged is false', async () => {
      await createTestingModule({
        flagConfiguration: {
          [FLAG_KEY]: {
            variants: { default: false, premium: true },
            defaultVariant: 'default',
            disabled: false,
            contextEvaluator: (context) => (context['userType'] === 'premium' ? 'premium' : 'default'),
          },
        },
      });

      // Initially should show default
      let valueElement =
        currentContextChangeDisabledComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👎');

      // Change context
      await OpenFeature.setContext({ userType: 'premium' });
      currentContextChangeDisabledComponentFixture.detectChanges();

      // Should not show premium value
      valueElement = currentContextChangeDisabledComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👎');
    });
  });

  describe('config changes', () => {
    it('should update when flag config changes', async () => {
      await createTestingModule({
        flagConfiguration: {
          [FLAG_KEY]: {
            variants: { default: false, premium: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });

      // Initially should show default
      let valueElement = currentTestComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👎');

      // Change flag config
      await currentProvider.putConfiguration({
        [FLAG_KEY]: {
          variants: { default: false, premium: true },
          defaultVariant: 'premium',
          disabled: false,
        },
      });
      currentTestComponentFixture.detectChanges();

      // Should now show premium value
      valueElement = currentTestComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👍');
    });

    it('should not update when flag config changes and updateOnConfigurationChanged is false', async () => {
      await createTestingModule({
        flagConfiguration: {
          [FLAG_KEY]: {
            variants: { default: false, premium: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });

      // Initially should show default
      let valueElement =
        currentConfigChangeDisabledComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👎');

      // Change flag config
      await currentProvider.putConfiguration({
        [FLAG_KEY]: {
          variants: { default: false, premium: true },
          defaultVariant: 'premium',
          disabled: false,
        },
      });
      currentTestComponentFixture.detectChanges();

      // Should not show premium value
      valueElement = currentConfigChangeDisabledComponentFixture.nativeElement.querySelector('[data-testid="value"]');
      expect(valueElement?.textContent).toBe('👎');
    });
  });

  describe('different flag types', () => {
    beforeEach(async () => {
      await createTestingModule({
        flagConfiguration: {
          booleanFlag: {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
          stringFlag: {
            variants: { default: 'test-value' },
            defaultVariant: 'default',
            disabled: false,
          },
          numberFlag: {
            variants: { default: 42 },
            defaultVariant: 'default',
            disabled: false,
          },
          objectFlag: {
            variants: { default: { theme: 'dark', count: 5 } },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      service = TestBed.inject(FeatureFlagService);
    });

    it('should handle boolean flags', async () => {
      const value = await firstValueFrom(service.getBooleanDetails('booleanFlag', false).pipe(map((d) => d.value)));
      expect(value).toBe(true);
    });

    it('should handle string flags', async () => {
      const value = await firstValueFrom(service.getStringDetails('stringFlag', 'default').pipe(map((d) => d.value)));
      expect(value).toBe('test-value');
    });

    it('should handle number flags', async () => {
      const value = await firstValueFrom(service.getNumberDetails('numberFlag', 0).pipe(map((d) => d.value)));
      expect(value).toBe(42);
    });

    it('should handle object flags', async () => {
      const value = await firstValueFrom(service.getObjectDetails('objectFlag', {}).pipe(map((d) => d.value)));
      expect(value).toEqual({ theme: 'dark', count: 5 });
    });
  });

  describe('error handling', () => {
    it('should handle provider errors gracefully', async () => {
      class ErrorProvider extends TestingProvider {
        override async initialize(): Promise<void> {
          throw new Error('Provider initialization failed');
        }

        override resolveBooleanEvaluation(): ResolutionDetails<boolean> {
          throw new Error('Evaluation failed');
        }

        override resolveStringEvaluation(): ResolutionDetails<string> {
          throw new Error('Evaluation failed');
        }

        override resolveNumberEvaluation(): ResolutionDetails<number> {
          throw new Error('Evaluation failed');
        }

        override resolveObjectEvaluation<T extends JsonValue>(): ResolutionDetails<T> {
          throw new Error('Evaluation failed');
        }
      }

      const errorProvider = new ErrorProvider(
        {
          [FLAG_KEY]: {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
        0,
      );
      await OpenFeature.close();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [OpenFeatureModule.forRoot({ provider: errorProvider })],
        providers: [FeatureFlagService],
      });
      service = TestBed.inject(FeatureFlagService);

      const value = await firstValueFrom(service.getBooleanDetails(FLAG_KEY, false).pipe(map((d) => d.value)));
      expect(value).toBe(false);
    });
  });
});
