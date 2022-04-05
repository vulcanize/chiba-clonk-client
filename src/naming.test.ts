import assert from 'assert';

import { Account } from './account';
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

  xtest('Reserve already reserved authority', async () => {
    await expect(registry.reserveAuthority({ name: authorityName, owner: accountAddress }, accountAddress, privateKey, fee)).rejects.toThrow('Name already reserved.');
  });

  test('Reserve sub-authority.', async () => {
    const subAuthority = `echo.${authorityName}`;
    await registry.reserveAuthority({ name: subAuthority, owner: accountAddress }, accountAddress, privateKey, fee);
    await wait(5000)

    const [record] = await registry.lookupAuthorities([subAuthority]);
    expect(record).toBeDefined();
    expect(record.ownerAddress).not.toBe('');
    expect(record.ownerPublicKey).not.toBe('');
    expect(Number(record.height)).toBeGreaterThan(0);
  });

  test('Reserve sub-authority with different owner.', async () => {
    // Create another account, send tx to set public key on the account.
    const mnenonic1 = Account.generateMnemonic();
    const otherAccount1 = await Account.generateFromMnemonic(mnenonic1);
    await otherAccount1.init()
    assert(otherAccount1.formattedCosmosAddress)
    await registry.sendCoins({ denom: 'aphoton', amount: '1000000000', destinationAddress: otherAccount1.formattedCosmosAddress }, accountAddress, privateKey, fee);

    const mnenonic2 = Account.generateMnemonic();
    const otherAccount2 = await Account.generateFromMnemonic(mnenonic2);
    await otherAccount2.init()
    assert(otherAccount2.formattedCosmosAddress)
    await registry.sendCoins({ denom: 'aphoton', amount: '10', destinationAddress: otherAccount2.formattedCosmosAddress }, accountAddress, privateKey, fee);

    await wait(5000)

    const subAuthority = `halo.${authorityName}`;
    await registry.reserveAuthority({ name: subAuthority, owner: otherAccount1.formattedCosmosAddress }, accountAddress, privateKey, fee);
    await wait(5000)

    const [record] = await registry.lookupAuthorities([subAuthority]);
    expect(record).toBeDefined();
    expect(record.ownerAddress).toBeDefined();
    expect(record.ownerAddress).toBe(otherAccount1.formattedCosmosAddress);
    expect(record.ownerPublicKey).toBeDefined();
    expect(Number(record.height)).toBeGreaterThan(0);
  });
};

if (mockServer || process.env.WIRE_AUCTIONS_ENABLED) {
  // Required as jest complains if file has no tests.
  test('skipping naming tests', () => {});
} else {
  describe('Naming', namingTests);
}
