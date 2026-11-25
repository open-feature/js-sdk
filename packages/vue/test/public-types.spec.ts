import { h } from 'vue';
import type { FlagValue } from '@openfeature/web-sdk';
import type { FeatureFlagComponentProps, FeatureFlagProps, FlagQuery } from '../src';
import { FeatureFlag } from '../src';

describe('public types', () => {
  it('exposes typed FeatureFlag props and slots', () => {
    const props: FeatureFlagComponentProps = {
      flagKey: 'theme',
      defaultValue: 'light',
      matchValue: 'dark',
    };
    const booleanProps: FeatureFlagComponentProps = {
      flagKey: 'enabled',
      defaultValue: false,
    };
    const componentProps: InstanceType<typeof FeatureFlag>['$props'] = props;
    const slot: InstanceType<typeof FeatureFlag>['$slots']['default'] = (query: FlagQuery<FlagValue>) => [
      h('div', String(query.value)),
    ];
    type SlotArgument = Parameters<NonNullable<typeof slot>>[0];
    const slotIsTyped: SlotArgument extends FlagQuery<FlagValue> ? true : false = true;

    expect(componentProps).toBe(props);
    expect(booleanProps.defaultValue).toBe(false);
    expect(slotIsTyped).toBe(true);
  });

  it('requires matchValue for non-boolean FeatureFlag props', () => {
    type MissingStringMatch = Omit<FeatureFlagProps<string>, 'matchValue'>;
    const stringRequiresMatch: MissingStringMatch extends FeatureFlagProps<string> ? false : true = true;
    type ComponentProps = InstanceType<typeof FeatureFlag>['$props'];
    type NonBooleanComponentProps = Extract<ComponentProps, { matchValue: unknown }>;
    type MissingComponentMatch = Omit<NonBooleanComponentProps, 'matchValue'>;
    const componentRequiresMatch: MissingComponentMatch extends ComponentProps ? false : true = true;

    expect(stringRequiresMatch).toBe(true);
    expect(componentRequiresMatch).toBe(true);
  });
});
