import { Registry } from './index';
import { getConfig } from './testing/helper';

const { mockServer, chibaClonk: { chainId, endpoint, privateKey, accountAddress, fee } } = getConfig();

jest.setTimeout(90 * 1000);

const bondTests = () => {
  let registry: Registry;
  let bondId1: string;

  beforeAll(async () => {
    registry = new Registry(endpoint, chainId);
  });

  test('Create bond.', async () => {
    bondId1 = await registry.getNextBondId(accountAddress);
    expect(bondId1).toBeDefined();
    await registry.createBond({ denom: 'aphoton', amount: '100' }, accountAddress, privateKey, fee);
  })
};

if (mockServer) {
  // Required as jest complains if file has no tests.
  test('skipping bond tests', () => {});
} else {
  describe('Bonds', bondTests);
}
