export default {
  'boolean-flag': {
    disabled: false,
    variants: {
      on: true,
      off: false,
    },
    defaultVariant: 'on',
  },
  'string-flag': {
    disabled: false,
    variants: {
      greeting: 'hi',
      parting: 'bye',
    },
    defaultVariant: 'greeting',
  },
  'integer-flag': {
    disabled: false,
    variants: {
      one: 1,
      ten: 10,
    },
    defaultVariant: 'ten',
  },
  'float-flag': {
    disabled: false,
    variants: {
      tenth: 0.1,
      half: 0.5,
    },
    defaultVariant: 'half',
  },
  'object-flag': {
    disabled: false,
    variants: {
      empty: {},
      template: {
        showImages: true,
        title: 'Check out these pics!',
        imagesPerPage: 100,
      },
    },
    defaultVariant: 'template',
  },
  'context-aware': {
    disabled: false,
    variants: {
      internal: 'INTERNAL',
      external: 'EXTERNAL',
    },
    defaultVariant: 'external',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contextEvaluator(ctx: any) {
      const { fn, ln, age, customer } = ctx;
      if (fn === 'Sulisław' && ln === 'Świętopełk' && age === 29 && customer === false) {
        return 'internal';
      } else {
        return 'external';
      }
    },
  },
  'wrong-flag': {
    disabled: false,
    variants: {
      one: 'uno',
      two: 'dos',
    },
    defaultVariant: 'one',
  },
} as const;
