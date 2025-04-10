const context = 'Components using OpenFeature must be wrapped with an <OpenFeatureProvider>.';
const tip = 'If you are seeing this in a test, see: https://openfeature.dev/docs/reference/technologies/client/web/react#testing';

export class MissingContextError extends Error {
  constructor(reason: string) {
    super(`${reason}: ${context} ${tip}`);
    this.name = 'MissingContextError';
  }
}