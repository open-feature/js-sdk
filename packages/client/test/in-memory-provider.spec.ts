import { FlagNotFoundError, GeneralError, InMemoryProvider, ProviderEvents, StandardResolutionReasons, TypeMismatchError } from '../src';
import { FlagConfiguration } from '../src/provider/in-memory-provider/flag-configuration';
import { VariantNotFoundError } from '../src/provider/in-memory-provider/variant-not-found-error';

describe('in-memory provider', () => {
  describe('initialize', () => {
    it('Should not throw for valid flags', async () => {
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
      const provider = new InMemoryProvider(booleanFlagSpec);
      await provider.initialize();
    });

    it('Should throw on invalid flags', async () => {
      const throwingFlagSpec: FlagConfiguration = {
        'a-boolean-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'on',
          contextEvaluator: () => {
            throw new GeneralError('context eval error');
          },
        },
      };
      const provider = new InMemoryProvider(throwingFlagSpec);
      const someContext = {};
      await expect(provider.initialize(someContext)).rejects.toThrow();
    });
  });

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
      await provider.putConfiguration(booleanFlagSpec);

      const resolution = provider.resolveBooleanEvaluation('a-boolean-flag', true);

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
      await provider.putConfiguration(booleanFlagSpec);

      expect(() => provider.resolveBooleanEvaluation('another-boolean-flag', false)).toThrow();
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
      await provider.putConfiguration(booleanFlagDisabledSpec);

      const resolution = provider.resolveBooleanEvaluation('a-boolean-flag', false);

      expect(resolution).toEqual({ value: false, reason: StandardResolutionReasons.DISABLED });
    });

    it('throws VariantNotFoundError if variant does not exist', async () => {
      const booleanFlagSpec = {
        'a-boolean-flag': {
          variants: {
            on: true,
            off: false,
          },
          disabled: false,
          defaultVariant: 'dummy',
        },
      };
      await provider.putConfiguration(booleanFlagSpec);

      expect(() => provider.resolveBooleanEvaluation('a-boolean-flag', false)).toThrow(VariantNotFoundError);
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
      await provider.putConfiguration(booleanFlagSpec);

      expect(() => provider.resolveBooleanEvaluation('a-boolean-flag', false)).toThrow(TypeMismatchError);
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
      const dummyContext = {};
      await provider.putConfiguration(booleanFlagCtxSpec);

      const resolution = provider.resolveBooleanEvaluation('a-boolean-flag', true, dummyContext);

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
      await provider.putConfiguration(stringFlagSpec);

      const resolution = provider.resolveStringEvaluation('a-string-flag', itsDefault);

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

      await provider.putConfiguration(StringFlagSpec);

      expect(() => provider.resolveStringEvaluation('another-string-flag', itsDefault)).toThrow(FlagNotFoundError);
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
      await provider.putConfiguration(StringFlagDisabledSpec);

      const resolution = provider.resolveStringEvaluation('a-string-flag', itsDefault);

      expect(resolution).toEqual({ value: itsDefault, reason: StandardResolutionReasons.DISABLED });
    });

    it('throws VariantNotFoundError if variant does not exist', async () => {
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
      await provider.putConfiguration(StringFlagSpec);

      expect(() => provider.resolveStringEvaluation('a-string-flag', itsDefault)).toThrow(VariantNotFoundError);
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

      await provider.putConfiguration(StringFlagSpec);

      expect(() => provider.resolveStringEvaluation('a-string-flag', itsDefault)).toThrow(TypeMismatchError);
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
      const dummyContext = {};
      await provider.putConfiguration(StringFlagCtxSpec);

      const resolution = provider.resolveStringEvaluation('a-string-flag', itsDefault, dummyContext);

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
      await provider.putConfiguration(numberFlagSpec);

      const resolution = provider.resolveNumberEvaluation('a-number-flag', defaultNumber);

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
      await provider.putConfiguration(numberFlagSpec);

      expect(() => provider.resolveNumberEvaluation('another-number-flag', defaultNumber)).toThrow(FlagNotFoundError);
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
      await provider.putConfiguration(numberFlagDisabledSpec);

      const resolution = provider.resolveNumberEvaluation('a-number-flag', defaultNumber);

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
      await provider.putConfiguration(numberFlagSpec);

      expect(() => provider.resolveNumberEvaluation('a-number-flag', defaultNumber)).toThrow(VariantNotFoundError);
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

      await provider.putConfiguration(numberFlagSpec);

      expect(() => provider.resolveNumberEvaluation('a-number-flag', defaultNumber)).toThrow(TypeMismatchError);
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
      const dummyContext = {};
      await provider.putConfiguration(numberFlagCtxSpec);

      const resolution = provider.resolveNumberEvaluation('a-number-flag', defaultNumber, dummyContext);

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
      await provider.putConfiguration(ObjectFlagSpec);

      const resolution = provider.resolveObjectEvaluation('a-object-flag', defaultObject);

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
      await provider.putConfiguration(ObjectFlagSpec);

      expect(() => provider.resolveObjectEvaluation('another-number-flag', defaultObject)).toThrow(FlagNotFoundError);
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
      await provider.putConfiguration(ObjectFlagDisabledSpec);

      const resolution = provider.resolveObjectEvaluation('a-object-flag', defaultObject);

      expect(resolution).toEqual({ value: defaultObject, reason: StandardResolutionReasons.DISABLED });
    });

    it('throws VariantNotFoundError if variant does not exist', async () => {
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
      await provider.putConfiguration(ObjectFlagSpec);

      expect(() => provider.resolveObjectEvaluation('a-Object-flag', defaultObject)).toThrow(VariantNotFoundError);
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

      await provider.putConfiguration(ObjectFlagSpec);

      expect(() => provider.resolveObjectEvaluation('a-object-flag', defaultObject)).toThrow(TypeMismatchError);
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
      const dummyContext = {};
      await provider.putConfiguration(ObjectFlagCtxSpec);

      const resolution = provider.resolveObjectEvaluation('a-object-flag', defaultObject, dummyContext);

      expect(resolution).toEqual({
        value: offObject,
        reason: StandardResolutionReasons.TARGETING_MATCH,
        variant: 'off',
      });
    });
  });

  describe('events', () => {
    it('emits provider changed event, ready event and has READY status', async () => {
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

      const configChangedSpy = jest.fn();
      provider.events.addHandler(ProviderEvents.ConfigurationChanged, configChangedSpy);

      const newFlagSpec = {
        'some-flag': {
          variants: {
            off: 'some-other-value',
          },
          defaultVariant: 'off',
          disabled: false,
        },
      };
      await provider.putConfiguration(newFlagSpec);

      expect(configChangedSpy).toHaveBeenCalledWith({ flagsChanged: ['some-flag'] });
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

      await provider.initialize();

      const firstResolution = provider.resolveStringEvaluation('some-flag', 'deafaultFirstResolution');

      expect(firstResolution).toEqual({
        value: 'initial-value',
        reason: StandardResolutionReasons.STATIC,
        variant: 'on',
      });

      await provider.putConfiguration({
        'some-flag': {
          variants: {
            on: 'new-value',
          },
          defaultVariant: 'on',
          disabled: false,
        },
      });

      const secondResolution = provider.resolveStringEvaluation('some-flag', 'defaultSecondResolution');

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

      await provider.initialize();

      // I passed configuration by reference, so maybe I can mess
      // with it behind the providers back!
      flagsSpec['some-flag'] = substituteSpec;

      const resolution = provider.resolveStringEvaluation('some-flag', 'default value');
      expect(resolution).toEqual({ value: 'initial-value', reason: StandardResolutionReasons.STATIC, variant: 'on' });
    });
  });
});
