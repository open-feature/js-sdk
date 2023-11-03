import { ErrorCode, FlagNotFoundError, ProviderEvents, StandardResolutionReasons, TypeMismatchError } from '@openfeature/core';
import { InMemoryProvider } from '../src';
import { VariantFoundError } from '../src/provider/in-memory-provider/variant-not-found-error';

describe(InMemoryProvider, () => {
  describe('boolean flags', () => {
    const provider = new InMemoryProvider({});
    it('resolves to default variant with reason static', async () => {
      const booleanFlagSpec = {
        'a-boolean-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(booleanFlagSpec);

      const resolution = await provider.resolveBooleanEvaluation('a-boolean-flag', true);

      expect(resolution).toEqual({ value: true, reason: StandardResolutionReasons.STATIC, variant: 'on' });
    });

    it('throws FlagNotFound if flag does not exist', async () => {
      const booleanFlagSpec = {
        'a-boolean-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(booleanFlagSpec);

      await expect(provider.resolveBooleanEvaluation('another-boolean-flag', false)).rejects.toThrow();
    });

    it('resolves to default value with reason disabled if flag is disabled', async () => {
      const booleanFlagDisabledSpec = {
        'a-boolean-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: true,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(booleanFlagDisabledSpec);

      const resolution = await provider.resolveBooleanEvaluation('a-boolean-flag', false);

      expect(resolution).toEqual({ value: false, reason: StandardResolutionReasons.DISABLED });
    });

    it('throws VariantFoundError if variant does not exist', async () => {
      const booleanFlagDisabledSpec = {
        'a-boolean-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'dummy',
        },
      };
      provider.putConfiguration(booleanFlagDisabledSpec);

      await expect(provider.resolveBooleanEvaluation('a-boolean-flag', false)).rejects.toThrow(VariantFoundError);
    });

    it('throws TypeMismatchError if variant type does not match with accessors', async () => {
      const booleanFlagSpec = {
        'a-boolean-flag': {
          variants: {
            on: 'yes',
            off: 'no',
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(booleanFlagSpec);

      await expect(provider.resolveBooleanEvaluation('a-boolean-flag', false)).rejects.toThrow(TypeMismatchError);
    });

    it('resolves to variant value with reason target match if context is provided and flag spec has context evaluator', async () => {
      const booleanFlagCtxSpec = {
        'a-boolean-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: () => 'off',
        },
      };
      provider.putConfiguration(booleanFlagCtxSpec);
      const dummyContext = {};

      const resolution = await provider.resolveBooleanEvaluation('a-boolean-flag', true, dummyContext);

      expect(resolution).toEqual({ value: false, reason: StandardResolutionReasons.TARGETING_MATCH, variant: 'off' });
    });
  });

  describe('string flags', () => {
    const provider = new InMemoryProvider({});
    const itsDefault = "it's deafault";
    const itsOn = "it's on";
    const itsOff = "it's off";
    it('resolves to default variant with reason static', async () => {
      const stringFlagSpec = {
        'a-string-flag': {
          variants: {
            on: itsOn,
            off: itsOff,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(stringFlagSpec);

      const resolution = await provider.resolveStringEvaluation('a-string-flag', itsDefault);

      expect(resolution).toEqual({ value: itsOn, reason: StandardResolutionReasons.STATIC, variant: 'on' });
    });

    it('throws FlagNotFound if flag does not exist', async () => {
      const StringFlagSpec = {
        'a-string-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };

      provider.putConfiguration(StringFlagSpec);

      await expect(provider.resolveStringEvaluation('another-string-flag', itsDefault)).rejects.toThrow(FlagNotFoundError);
    });

    it('resolves to default value with reason disabled if flag is disabled', async () => {
      const StringFlagDisabledSpec = {
        'a-string-flag': {
          variants: {
            on: itsOn,
            off: itsOff,
          },
          disabled: true,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(StringFlagDisabledSpec);

      const resolution = await provider.resolveStringEvaluation('a-string-flag', itsDefault);

      expect(resolution).toEqual({ value: itsDefault, reason: StandardResolutionReasons.DISABLED });
    });

    it('throws VariantFoundError if variant does not exist', async () => {
      const StringFlagSpec = {
        'a-string-flag': {
          variants: {
            on: itsOn,
            off: itsOff,
          },
          disabled: false,
          defaultVariant: 'dummy',
        },
      };
      provider.putConfiguration(StringFlagSpec);

      await expect(provider.resolveStringEvaluation('a-string-flag', itsDefault)).rejects.toThrow(VariantFoundError);
    });

    it('throws TypeMismatchError if variant does not match with accessor method type', async () => {
      const StringFlagSpec = {
        'a-string-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };

      provider.putConfiguration(StringFlagSpec);

      await expect(provider.resolveStringEvaluation('a-string-flag', itsDefault)).rejects.toThrow(TypeMismatchError);
    });

    it('resolves to variant value with reason target match if context is provided and flag spec has context evaluator', async () => {
      const StringFlagCtxSpec = {
        'a-string-flag': {
          variants: {
            on: itsOn,
            off: itsOff,
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: () => 'off',
        },
      };
      provider.putConfiguration(StringFlagCtxSpec);
      const dummyContext = {};

      const resolution = await provider.resolveStringEvaluation('a-string-flag', itsDefault, dummyContext);

      expect(resolution).toEqual({ value: itsOff, reason: StandardResolutionReasons.TARGETING_MATCH, variant: 'off' });
    });
  });

  describe('number flags', () => {
    const provider = new InMemoryProvider({});
    const defaultNumber = 42;
    const onNumber = -528;
    const offNumber = 0;
    it('resolves to default variant with reason static', async () => {
      const numberFlagSpec = {
        'a-number-flag': {
          variants: {
            on: onNumber,
            off: offNumber,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(numberFlagSpec);

      const resolution = await provider.resolveNumberEvaluation('a-number-flag', defaultNumber);

      expect(resolution).toEqual({ value: onNumber, reason: StandardResolutionReasons.STATIC, variant: 'on' });
    });

    it('throws FlagNotFound if flag does not exist', async () => {
      const numberFlagSpec = {
        'a-number-flag': {
          variants: {
            on: onNumber,
            off: offNumber,
          },
          disabled: false,
          defaultVariant: 'dummy',
        },
      };
      provider.putConfiguration(numberFlagSpec);

      await expect(provider.resolveNumberEvaluation('another-number-flag', defaultNumber)).rejects.toThrow(FlagNotFoundError);
    });

    it('resolves to default value with reason disabled if flag is disabled', async () => {
      const numberFlagDisabledSpec = {
        'a-number-flag': {
          variants: {
            on: onNumber,
            off: offNumber,
          },
          disabled: true,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(numberFlagDisabledSpec);

      const resolution = await provider.resolveNumberEvaluation('a-number-flag', defaultNumber);

      expect(resolution).toEqual({ value: defaultNumber, reason: StandardResolutionReasons.DISABLED });
    });

    it('throws VariantNotFoundError if variant does not exist', async () => {
      const numberFlagSpec = {
        'a-number-flag': {
          variants: {
            on: onNumber,
            off: offNumber,
          },
          disabled: false,
          defaultVariant: 'dummy',
        },
      };
      provider.putConfiguration(numberFlagSpec);

      await expect(provider.resolveNumberEvaluation('a-number-flag', defaultNumber)).rejects.toThrow(VariantFoundError);
    });

    it('throws TypeMismatchError if variant does not match with accessor method type', async () => {
      const numberFlagSpec = {
        'a-number-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };

      provider.putConfiguration(numberFlagSpec);

      await expect(provider.resolveNumberEvaluation('a-number-flag', defaultNumber)).rejects.toThrow(TypeMismatchError);
    });

    it('resolves to variant value with reason target match if context is provided and flag spec has context evaluator', async () => {
      const numberFlagCtxSpec = {
        'a-number-flag': {
          variants: {
            on: onNumber,
            off: offNumber,
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: () => 'off',
        },
      };
      provider.putConfiguration(numberFlagCtxSpec);
      const dummyContext = {};

      const resolution = await provider.resolveNumberEvaluation('a-number-flag', defaultNumber, dummyContext);

      expect(resolution).toEqual({
        value: offNumber,
        reason: StandardResolutionReasons.TARGETING_MATCH,
        variant: 'off',
      });
    });
  });

  describe('Object flags', () => {
    const provider = new InMemoryProvider({});
    const defaultObject = { someKey: 'default' };
    const onObject = { someKey: 'on' };
    const offObject = { someKey: 'off' };
    it('resolves to default variant with reason static', async () => {
      const ObjectFlagSpec = {
        'a-object-flag': {
          variants: {
            on: onObject,
            off: offObject,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(ObjectFlagSpec);

      const resolution = await provider.resolveObjectEvaluation('a-object-flag', defaultObject);

      expect(resolution).toEqual({ value: onObject, reason: StandardResolutionReasons.STATIC, variant: 'on' });
    });

    it('throws FlagNotFound if flag does not exist', async () => {
      const ObjectFlagSpec = {
        'a-Object-flag': {
          variants: {
            on: onObject,
            off: offObject,
          },
          disabled: false,
          defaultVariant: 'dummy',
        },
      };
      provider.putConfiguration(ObjectFlagSpec);

      await expect(provider.resolveObjectEvaluation('another-number-flag', defaultObject)).rejects.toThrow(FlagNotFoundError);
    });

    it('resolves to default value with reason disabled if flag is disabled', async () => {
      const ObjectFlagDisabledSpec = {
        'a-object-flag': {
          variants: {
            on: onObject,
            off: offObject,
          },
          disabled: true,
          defaultVariant: 'on',
        },
      };
      provider.putConfiguration(ObjectFlagDisabledSpec);

      const resolution = await provider.resolveObjectEvaluation('a-object-flag', defaultObject);

      expect(resolution).toEqual({ value: defaultObject, reason: StandardResolutionReasons.DISABLED });
    });

    it('throws VariantFoundError if variant does not exist', async () => {
      const ObjectFlagSpec = {
        'a-Object-flag': {
          variants: {
            on: onObject,
            off: offObject,
          },
          disabled: false,
          defaultVariant: 'dummy',
        },
      };
      provider.putConfiguration(ObjectFlagSpec);

      await expect(provider.resolveObjectEvaluation('a-Object-flag', defaultObject)).rejects.toThrow(VariantFoundError);
    });

    it('throws TypeMismatchError if variant does not match with accessor method type', async () => {
      const ObjectFlagSpec = {
        'a-object-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
        },
      };

      provider.putConfiguration(ObjectFlagSpec);

      await expect(provider.resolveObjectEvaluation('a-object-flag', defaultObject)).rejects.toThrow(TypeMismatchError);
    });

    it('resolves to variant value with reason target match if context is provided and flag spec has context evaluator', async () => {
      const ObjectFlagCtxSpec = {
        'a-object-flag': {
          variants: {
            on: onObject,
            off: offObject,
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: () => 'off',
        },
      };
      provider.putConfiguration(ObjectFlagCtxSpec);
      const dummyContext = {};

      const resolution = await provider.resolveObjectEvaluation('a-object-flag', defaultObject, dummyContext);

      expect(resolution).toEqual({
        value: offObject,
        reason: StandardResolutionReasons.TARGETING_MATCH,
        variant: 'off',
      });
    });
  });

  describe('events', () => {
    it('emits provider changed event if a new value is added', (done) => {
      const flagsSpec = {
        'some-flag': {
          variants: {
            on: 'initial-value',
          },
          defaultVariant: 'on',
          disabled: false,
        },
      };
      const provider = new InMemoryProvider(flagsSpec);

      provider.events.addHandler(ProviderEvents.ConfigurationChanged, (details) => {
        expect(details?.flagsChanged).toEqual(['some-other-flag']);
        done();
      });

      const newFlag = {
        'some-other-flag': {
          variants: {
            off: 'some-other-value',
          },
          defaultVariant: 'off',
          disabled: false,
        },
      };

      const newflagsSpec = { ...flagsSpec, ...newFlag };
      provider.putConfiguration(newflagsSpec);
    });

    it('emits provider changed event if an existing value is changed', (done) => {
      const flagsSpec = {
        'some-flag': {
          variants: {
            on: 'initial-value',
          },
          defaultVariant: 'on',
          disabled: false,
        },
      };
      const provider = new InMemoryProvider(flagsSpec);

      provider.events.addHandler(ProviderEvents.ConfigurationChanged, (details) => {
        expect(details?.flagsChanged).toEqual(['some-flag']);
        done();
      });

      const newFlagSpec = {
        'some-flag': {
          variants: {
            off: 'some-other-value',
          },
          defaultVariant: 'off',
          disabled: false,
        },
      };
      provider.putConfiguration(newFlagSpec);
    });
  });

  describe('Flags configuration', () => {
    it('reflects changes in flag configuration', async () => {
      const provider = new InMemoryProvider({
        'some-flag': {
          variants: {
            on: 'initial-value',
          },
          defaultVariant: 'on',
          disabled: false,
        },
      });

      const firstResolution = await provider.resolveStringEvaluation('some-flag', 'deafaultFirstResolution');

      expect(firstResolution).toEqual({
        value: 'initial-value',
        reason: StandardResolutionReasons.STATIC,
        variant: 'on',
      });

      provider.putConfiguration({
        'some-flag': {
          variants: {
            on: 'new-value',
          },
          defaultVariant: 'on',
          disabled: false,
        },
      });

      const secondResolution = await provider.resolveStringEvaluation('some-flag', 'defaultSecondResolution');

      expect(secondResolution).toEqual({ value: 'new-value', reason: StandardResolutionReasons.STATIC, variant: 'on' });
    });

    it('does not let you change values with the configuration passed by reference', async () => {
      const flagsSpec = {
        'some-flag': {
          variants: {
            on: 'initial-value',
          },
          defaultVariant: 'on',
          disabled: false,
        },
      };

      const substituteSpec = {
        variants: {
          on: 'some-other-value',
        },
        defaultVariant: 'on',
        disabled: false,
      };

      const provider = new InMemoryProvider(flagsSpec);

      // I passed configuration by reference, so maybe I can mess
      // with it behind the providers back!
      flagsSpec['some-flag'] = substituteSpec;

      const resolution = await provider.resolveStringEvaluation('some-flag', 'default value');
      expect(resolution).toEqual({ value: 'initial-value', reason: StandardResolutionReasons.STATIC, variant: 'on' });
    });
  });
});
