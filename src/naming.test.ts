import { Registry } from './index';
import { getConfig, wait } from './testing/helper';

jest.setTimeout(120 * 1000);

const { mockServer, chibaClonk: { chainId, restEndpoint, gqlEndpoint, privateKey, accountAddress, fee } } = getConfig();

const namingTests = () => {
  let registry: Registry;

  let bondId: string;

  let authorityName: string;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);

    // Create bond.
    bondId = await registry.getNextBondId(accountAddress);
    await registry.createBond({ denom: 'aphoton', amount: '1000000000' }, accountAddress, privateKey, fee);
    await wait(5000)
  });

  test('Reserve authority.', async () => {
    authorityName = `dxos-${Date.now()}`;
    await registry.reserveAuthority({ name: authorityName, owner: accountAddress }, accountAddress, privateKey, fee);
    await wait(5000)
  });

  test('Lookup authority.', async () => {
    const [record] = await registry.lookupAuthorities([authorityName]);

    expect(record).toBeDefined();
    expect(record.ownerAddress).not.toBe('');
    expect(record.ownerPublicKey).not.toBe('');
    expect(Number(record.height)).toBeGreaterThan(0);
  });

  test('Lookup non existing authority', async () => {
    const [record] = await registry.lookupAuthorities(['does-not-exist']);

    expect(record.ownerAddress).toBe('');
    expect(record.ownerPublicKey).toBe('');
    expect(Number(record.height)).toBe(0);
  });
};

if (mockServer || process.env.WIRE_AUCTIONS_ENABLED) {
  // Required as jest complains if file has no tests.
  test('skipping naming tests', () => {});
} else {
  describe('Naming', namingTests);
}
