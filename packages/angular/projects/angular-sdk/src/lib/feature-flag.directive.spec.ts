import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { OpenFeatureModule } from './open-feature.module';
import { By } from '@angular/platform-browser';
import { Client, ClientProviderEvents, FlagValue, InMemoryProvider, OpenFeature } from '@openfeature/web-sdk';
import { TestingProvider } from '../test/test.utils';
import { v4 } from 'uuid';
import {
  BooleanFeatureFlagDirective,
  FeatureFlagDirectiveContext,
  NumberFeatureFlagDirective,
  ObjectFeatureFlagDirective,
  StringFeatureFlagDirective,
} from './feature-flag.directive';

@Component({
  standalone: true,
  imports: [
    BooleanFeatureFlagDirective,
    NumberFeatureFlagDirective,
    StringFeatureFlagDirective,
    ObjectFeatureFlagDirective,
  ],
  template: `
    <ng-container>
      <div class="case-1">
        <div *booleanFeatureFlag="'test-flag'; default: true; domain: domain" class="flag-status">Flag On</div>
      </div>
      <div class="case-2">
        <div *booleanFeatureFlag="'test-flag'; default: true; else: elseTemplate; domain: domain" class="flag-status">
          Flag On
        </div>
        <ng-template #elseTemplate>
          <div class="flag-status">Flag Off</div>
        </ng-template>
      </div>
      <div class="case-3">
        <div
          *booleanFeatureFlag="'test-flag'; default: false; initializing: initializingTemplate; domain: domain"
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #initializingTemplate>
          <div class="flag-status">Initializing</div>
        </ng-template>
      </div>
      <div class="case-4">
        <div
          *booleanFeatureFlag="'test-flag'; default: false; reconciling: reconcilingTemplate; domain: domain"
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #reconcilingTemplate>
          <div class="flag-status">Reconciling</div>
        </ng-template>
      </div>
      <div class="case-5">
        <div
          *booleanFeatureFlag="
            'test-flag';
            default: false;
            else: elseTemplate;
            initializing: initializingTemplate;
            reconciling: reconcilingTemplate;
            domain: domain
          "
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #elseTemplate>
          <div class="flag-status">Flag Off</div>
        </ng-template>
        <ng-template #initializingTemplate>
          <div class="flag-status">Initializing</div>
        </ng-template>
        <ng-template #reconcilingTemplate>
          <div class="flag-status">Reconciling</div>
        </ng-template>
      </div>
      <div class="case-6">
        <div
          *booleanFeatureFlag="specialFlagKey; default: true; else: elseTemplate; domain: domain"
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #elseTemplate>
          <div class="flag-status">Flag Off</div>
        </ng-template>
      </div>
      <div class="case-7">
        <div
          *numberFeatureFlag="'test-flag'; default: 0; value: 1; else: elseTemplate; domain: domain"
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #elseTemplate>
          <div class="flag-status">Flag Off</div>
        </ng-template>
      </div>
      <div class="case-8">
        <div
          *stringFeatureFlag="'test-flag'; default: 'default'; value: 'on'; else: elseTemplate; domain: domain"
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #elseTemplate>
          <div class="flag-status">Flag Off</div>
        </ng-template>
      </div>
      <div class="case-9">
        <div
          *objectFeatureFlag="
            'test-flag';
            default: {};
            value: { prop2: true, prop1: true };
            else: elseTemplate;
            domain: domain
          "
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #elseTemplate>
          <div class="flag-status">Flag Off</div>
        </ng-template>
      </div>
      <div class="case-10">
        <div
          *booleanFeatureFlag="
            'test-flag';
            default: false;
            domain: domain;
            else: elseTemplateWithContext;
            let value;
            let evaluationDetails = evaluationDetails
          "
          class="flag-status"
        >
          then {{ value }} {{ evaluationDetails.reason }}
        </div>
        <ng-template #elseTemplateWithContext let-value let-evaluationDetails="evaluationDetails">
          <div class="flag-status">else {{ value }} {{ evaluationDetails.reason }}</div>
        </ng-template>
      </div>
      <div class="case-11">
        <div
          *stringFeatureFlag="'test-flag'; default: 'default'; domain: domain; let value = $implicit"
          class="flag-status"
        >
          {{ value }}
        </div>
      </div>
      <div class="case-12">
        <div
          *booleanFeatureFlag="
            'test-flag';
            default: true;
            else: elseTemplate;
            domain: domain;
            updateOnConfigurationChanged: false
          "
          class="flag-status"
        >
          Flag On
        </div>
        <ng-template #elseTemplate>
          <div class="flag-status">Flag Off</div>
        </ng-template>
      </div>
    </ng-container>
  `,
})
class TestComponent {
  @Input() domain: string;
  @Input() specialFlagKey: string = 'test-flag';
  protected readonly JSON = JSON;
}

describe('FeatureFlagDirectiveContext', () => {
  it('should initialize $implicit and evaluationDetails from EvaluationDetails', () => {
    const mockDetails = {
      value: true,
      reason: 'STATIC',
      flagKey: 'test-flag',
      flagMetadata: {},
    };

    const context = new FeatureFlagDirectiveContext(mockDetails);

    expect(context.$implicit).toBe(true);
    expect(context.evaluationDetails).toEqual(mockDetails);
  });
});

describe('FeatureFlagDirective', () => {
  describe('thenTemplate', () => {
    it('should not be rendered if disabled by the flag', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: false },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });

      await expectAmountElements(fixture, 'case-1', 0);
    });

    it('should be rendered if enabled by the flag', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });

      await expectRenderedText(fixture, 'case-2', 'Flag On');
    });
  });

  describe('elseTemplate', () => {
    it('should not be rendered if not existent but enabled by the flag', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: false },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });

      await expectAmountElements(fixture, 'case-1', 0);
    });

    it('should not be rendered if existent but disabled by the flag', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-2', 'Flag On');
    });

    it('should be rendered if existent and enabled by the flag', async () => {
      const { fixture, provider } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-2', 'Flag On');

      await updateFlagValue(provider, false);
      fixture.detectChanges(); // Ensure change detection after flag update
      await expectRenderedText(fixture, 'case-2', 'Flag Off');
    });
  });

  describe('initializingTemplate', () => {
    it('should not be rendered if provider is ready', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });

      await expectRenderedText(fixture, 'case-3', 'Flag On');
    });

    it('should be rendered if provider is not ready', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
        providerInitDelay: 1000,
      });

      await expectRenderedText(fixture, 'case-3', 'Initializing');
    });

    it('should render until the provider is initialized', async () => {
      const { fixture, client } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
        providerInitDelay: 1000,
      });

      await expectRenderedText(fixture, 'case-3', 'Initializing');
      await waitForClientReady(client);
      await expectRenderedText(fixture, 'case-3', 'Flag On');
    });
  });

  describe('reconcilingTemplate', () => {
    it('should not be rendered if provider is ready', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });

      await expectRenderedText(fixture, 'case-3', 'Flag On');
    });

    it('should be rendered while provider is reconciling', async () => {
      const { fixture, domain, client } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
        providerInitDelay: 500,
      });
      await waitForClientReady(client);
      await expectRenderedText(fixture, 'case-4', 'Flag On');

      const setContextPromise = OpenFeature.setContext(domain, { newCtx: true });
      await expectRenderedText(fixture, 'case-4', 'Reconciling');

      await setContextPromise;
      await expectRenderedText(fixture, 'case-4', 'Flag On');
    });
  });

  describe('complex case', () => {
    it('should use initializing, then, else and reconciling in one go', async () => {
      const { fixture, provider, client, domain } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
        providerInitDelay: 500,
      });

      // Initializing
      await expectRenderedText(fixture, 'case-5', 'Initializing');
      await waitForClientReady(client);
      await expectRenderedText(fixture, 'case-5', 'Flag On');

      // Updating
      await updateFlagValue(provider, false);
      await expectRenderedText(fixture, 'case-5', 'Flag Off');

      // Reconciling
      const setContextPromise = OpenFeature.setContext(domain, { newCtx: true });
      await expectRenderedText(fixture, 'case-5', 'Reconciling');
      await setContextPromise;
      await expectRenderedText(fixture, 'case-5', 'Flag Off');

      // Updating 2
      await updateFlagValue(provider, true);
      await expectRenderedText(fixture, 'case-5', 'Flag On');
    });

    it('should evaluate on flag key change', async () => {
      const { fixture, client } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
          'new-test-flag': {
            variants: { default: false },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await waitForClientReady(client);
      await expectRenderedText(fixture, 'case-6', 'Flag On');

      fixture.componentRef.setInput('specialFlagKey', 'new-test-flag');
      await fixture.whenStable();

      await expectRenderedText(fixture, 'case-6', 'Flag Off');
    });

    it('should opt-out of re-rendering when flag value changes', async () => {
      const { fixture, client, provider } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
          'new-test-flag': {
            variants: { default: false },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await waitForClientReady(client);
      await expectRenderedText(fixture, 'case-12', 'Flag On');

      await updateFlagValue(provider, false);
      await expectRenderedText(fixture, 'case-12', 'Flag On');
    });

    it('should evaluate on flag domain change', async () => {
      const { fixture, client } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await waitForClientReady(client);
      await expectRenderedText(fixture, 'case-6', 'Flag On');

      const newDomain = v4();
      const newProvider = new TestingProvider(
        {
          'test-flag': {
            variants: { default: false },
            defaultVariant: 'default',
            disabled: false,
          },
        },
        0,
      );
      await OpenFeature.setProviderAndWait(newDomain, newProvider);

      fixture.componentRef.setInput('domain', newDomain);
      await fixture.whenStable();

      await expectRenderedText(fixture, 'case-6', 'Flag Off');
    });
  });

  describe('numberFeatureFlag', () => {
    it('should render thenTemplate on match and else elseTemplate  ', async () => {
      const { fixture, provider } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: 1 },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-7', 'Flag On');

      await updateFlagValue(provider, 2);
      await expectRenderedText(fixture, 'case-7', 'Flag Off');
    });
  });

  describe('stringFeatureFlag', () => {
    it('should render thenTemplate on match and else elseTemplate  ', async () => {
      const { fixture, provider } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: 'on' },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-8', 'Flag On');

      await updateFlagValue(provider, 'another-value');
      await expectRenderedText(fixture, 'case-8', 'Flag Off');
    });
  });

  describe('objectFeatureFlag', () => {
    it('should render thenTemplate on match and else elseTemplate', async () => {
      const { fixture, provider } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: { prop1: true, prop2: true } },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-9', 'Flag On');

      await updateFlagValue(provider, { prop2: 'string' });
      await expectRenderedText(fixture, 'case-9', 'Flag Off');
    });
  });

  describe('context', () => {
    it('should render thenTemplate from context', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: true },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-10', 'then true STATIC');
    });

    it('should render elseTemplate from context', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: false },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-10', 'else false STATIC');
    });

    it('should always render if no expected value is given', async () => {
      const { fixture } = await createTestingModule({
        flagConfiguration: {
          'test-flag': {
            variants: { default: 'flag-value' },
            defaultVariant: 'default',
            disabled: false,
          },
        },
      });
      await expectRenderedText(fixture, 'case-11', 'flag-value');
    });
  });
});

async function createTestingModule(config?: {
  flagConfiguration?: ConstructorParameters<typeof InMemoryProvider>[0];
  providerInitDelay?: number;
}): Promise<{ fixture: ComponentFixture<TestComponent>; provider: TestingProvider; domain: string; client: Client }> {
  const domain = v4();
  const provider = new TestingProvider(config?.flagConfiguration ?? {}, config?.providerInitDelay ?? 0);

  const fixture = TestBed.configureTestingModule({
    imports: [
      OpenFeatureModule.forRoot({ provider: new InMemoryProvider(), domainBoundProviders: { [domain]: provider } }),
      TestComponent,
    ],
  }).createComponent(TestComponent);

  fixture.componentRef.setInput('domain', domain);
  await fixture.whenStable();

  const client = OpenFeature.getClient(domain);
  if (!config.providerInitDelay) {
    await waitForClientReady(client);
  }

  return { provider, domain, client, fixture };
}

async function waitForClientReady(client: Client) {
  await new Promise((resolve) => client.addHandler(ClientProviderEvents.Ready, resolve));
}

async function updateFlagValue<T extends FlagValue>(provider: TestingProvider, value: T) {
  await provider.putConfiguration({
    'test-flag': {
      variants: { default: value },
      defaultVariant: 'default',
      disabled: false,
    },
  });
}

async function getElements(fixture: ComponentFixture<TestComponent>, testCase: string) {
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.debugElement.queryAll(By.css(`.${testCase} .flag-status`));
}

async function expectAmountElements(fixture: ComponentFixture<TestComponent>, testCase: string, amount: number) {
  const divElements = await getElements(fixture, testCase);
  expect(divElements.length).toEqual(amount);
}

async function expectRenderedText(fixture: ComponentFixture<TestComponent>, testCase: string, rendered: string) {
  const divElements = await getElements(fixture, testCase);
  expect(divElements.length).toEqual(1);
  expect(divElements[0].nativeElement.textContent.trim()).toBe(rendered);
}
