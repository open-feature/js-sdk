import { OpenFeatureClient } from '../src/client.js';
import { OpenFeature } from '../src/open-feature.js';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 2034;
const OBJECT_VALUE = {
  key: 'value',
};

const NO_OP_FLAG = 'no-op-flag';

describe(OpenFeatureClient.name, () => {
  describe('No-op behavior', () => {
    // create a no-op client.
    const client = OpenFeature.getClient();

    it('should default all evaluations', async () => {
      await expect(client.getBooleanValue(NO_OP_FLAG, BOOLEAN_VALUE)).resolves.toEqual(BOOLEAN_VALUE);
      await expect(client.getStringValue(NO_OP_FLAG, STRING_VALUE)).resolves.toEqual(STRING_VALUE);
      await expect(client.getNumberValue(NO_OP_FLAG, NUMBER_VALUE)).resolves.toEqual(NUMBER_VALUE);
      await expect(client.getObjectValue(NO_OP_FLAG, OBJECT_VALUE)).resolves.toEqual(OBJECT_VALUE);
    });
  });
});
