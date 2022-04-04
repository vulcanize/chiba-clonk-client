import { Registry } from './index';
import { getConfig, wait } from './testing/helper';

const { mockServer, chibaClonk: { chainId, restEndpoint, gqlEndpoint, privateKey, accountAddress, fee } } = getConfig();

jest.setTimeout(90 * 1000);

const bondTests = () => {
  let registry: Registry;
  let bondId1: string;

  let bondOwner: string;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);
  });

  test('Create bond.', async () => {
    bondId1 = await registry.getNextBondId(accountAddress);
    expect(bondId1).toBeDefined();
    await registry.createBond({ denom: 'aphoton', amount: '100' }, accountAddress, privateKey, fee);
    await wait(5000)
  })

  test('Get bond by ID.', async () => {
    const [bond] = await registry.getBondsByIds([bondId1]);
    expect(bond).toBeDefined();
    expect(bond.id).toBe(bondId1);
    expect(bond.balance).toHaveLength(1);
    expect(bond.balance[0]).toEqual({ type: 'aphoton', quantity: '100' });
    bondOwner = bond.owner;
  });

  test('Query bonds.', async () => {
    const bonds = await registry.queryBonds();
    expect(bonds).toBeDefined();
    const bond = bonds.filter((bond: any) => bond.id === bondId1);
    expect(bond).toBeDefined();
  });

  test('Query bonds by owner.', async () => {
    const bonds = await registry.queryBonds({ owner: bondOwner });
    expect(bonds).toBeDefined();
    const bond = bonds.filter((bond: any) => bond.id === bondId1);
    expect(bond).toBeDefined();
  });
};

if (mockServer) {
  // Required as jest complains if file has no tests.
  test('skipping bond tests', () => {});
} else {
  describe('Bonds', bondTests);
}
