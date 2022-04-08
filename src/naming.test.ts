import assert from 'assert';
import path from 'path';

import { Account } from './account';
import { Registry } from './index';
import { ensureUpdatedConfig, getConfig } from './testing/helper';

const WATCHER_ID = 'bafyreibmr47ksukoadck2wigevb2jp5j5oubfadeyzb6zi57ydjsvjmmby'
const WATCHER_YML_PATH = path.join(__dirname, './testing/data/watcher.yml');

jest.setTimeout(120 * 1000);

const { chainId, restEndpoint, gqlEndpoint, privateKey, accountAddress, fee } = getConfig();

const namingTests = () => {
  let registry: Registry;
  let bondId: string;
  let watcher: any;
  let watcherId: string;
  let authorityName: string;
  let wrn: string;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);

    // Create bond.
    bondId = await registry.getNextBondId(accountAddress);
    await registry.createBond({ denom: 'aphoton', amount: '1000000000' }, accountAddress, privateKey, fee);

    // Create bot.
    watcher = await ensureUpdatedConfig(WATCHER_YML_PATH);
    const result = await registry.setRecord(
      {
        privateKey,
        bondId,
        record: watcher.record
      },
      accountAddress,
      privateKey,
      fee
    )

    // TODO: Get id from setRecord response.
    // watcherId = result.data;
    watcherId = WATCHER_ID;
  });

  test('Reserve authority.', async () => {
    authorityName = `dxos-${Date.now()}`;
    await registry.reserveAuthority({ name: authorityName, owner: accountAddress }, accountAddress, privateKey, fee);
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

    const subAuthority = `halo.${authorityName}`;
    await registry.reserveAuthority({ name: subAuthority, owner: otherAccount1.formattedCosmosAddress }, accountAddress, privateKey, fee);

    const [record] = await registry.lookupAuthorities([subAuthority]);
    expect(record).toBeDefined();
    expect(record.ownerAddress).toBeDefined();
    expect(record.ownerAddress).toBe(otherAccount1.formattedCosmosAddress);
    expect(record.ownerPublicKey).toBeDefined();
    expect(Number(record.height)).toBeGreaterThan(0);
  });

  xtest('Set name for unbonded authority', async () => {
    wrn = `wrn://${authorityName}/app/test`;
    assert(watcherId)
    await expect(registry.setName({ wrn, cid: watcherId }, accountAddress, privateKey, fee)).rejects.toThrow('Authority bond not found.');
  });

  test('Set authority bond', async () => {
    await registry.setAuthorityBond({ name: authorityName, bondId }, accountAddress, privateKey, fee);
  });
};

if (process.env.AUCTIONS_ENABLED) {
  // Required as jest complains if file has no tests.
  test('skipping naming tests', () => {});
} else {
  describe('Naming', namingTests);
}
