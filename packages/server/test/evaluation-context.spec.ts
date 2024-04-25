import { EvaluationContext, OpenFeature } from '../src';

describe('Evaluation Context', () => {
  afterEach(async () => {
    OpenFeature.setContext({});
    jest.clearAllMocks();
  });

  describe('Requirement 3.2.2', () => {
    it('the API MUST have a method for setting the global evaluation context', () => {
      const context: EvaluationContext = { property1: false };
      OpenFeature.setContext(context);
      expect(OpenFeature.getContext()).toEqual(context);
    });

    it('the API MUST have a method for setting evaluation context for a named client', () => {
      const context: EvaluationContext = { property1: false };
      OpenFeature.setContext(context);
      expect(OpenFeature.getContext()).toEqual(context);
    });
  });

  describe.skip('Requirement 3.2.4', () => {
    // Only applies to the static-context paradigm
  });
});
