import { OpenFeature } from '../src/open-feature';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 2034;
const OBJECT_VALUE = {
  key: 'value',
};

const NO_OP_FLAG = 'no-op-flag';

describe('OpenFeatureClient', () => {
  describe('No-op behavior', () => {
    // create a no-op client.
    const client = OpenFeature.getClient();

    it('should default all evaluations', async () => {
      expect(client.getBooleanValue(NO_OP_FLAG, BOOLEAN_VALUE)).toEqual(BOOLEAN_VALUE);
      expect(client.getStringValue(NO_OP_FLAG, STRING_VALUE)).toEqual(STRING_VALUE);
      expect(client.getNumberValue(NO_OP_FLAG, NUMBER_VALUE)).toEqual(NUMBER_VALUE);
      expect(client.getObjectValue(NO_OP_FLAG, OBJECT_VALUE)).toEqual(OBJECT_VALUE);
    });
  });
});
