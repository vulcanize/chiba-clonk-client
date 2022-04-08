import assert from 'assert';
import path from 'path';
import semver from 'semver';

import { Account } from './account';
import { Registry } from './index';
import { getBaseConfig, getConfig } from './testing/helper';

const WATCHER_1_ID = 'bafyreif7z4lbftuxkj7nu4bl7xihitqvhus3wmoqdkjo7lwv24j6fkfskm'
const WATCHER_2_ID = 'bafyreiaplz7n2bddg3xhkeuiavwnku7xta2s2cfyaza37ytv4vw367exo4'
const WATCHER_YML_PATH = path.join(__dirname, './testing/data/watcher.yml');

jest.setTimeout(120 * 1000);

const { chainId, restEndpoint, gqlEndpoint, privateKey, accountAddress, fee } = getConfig();

const namingTests = () => {
  let registry: Registry;

  let bondId: string;
  let watcher: any;
  let watcherId: string;

  let authorityName: string;
  let otherAuthorityName: string;
  let otherPrivateKey: string;
  let otherAccountAddress: string;

  let wrn: string;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);

    // Create bond.
    bondId = await registry.getNextBondId(accountAddress);
    await registry.createBond({ denom: 'aphoton', amount: '1000000000' }, accountAddress, privateKey, fee);

    // Create bot.
    // TODO: Use ensureUpdatedConfig from helper.
    watcher = await getBaseConfig(WATCHER_YML_PATH);
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
    watcherId = WATCHER_1_ID;
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

  test('Set name', async () => {
    wrn = `wrn://${authorityName}/app/test`;
    await registry.setName({ wrn, cid: watcherId }, accountAddress, privateKey, fee);

    // Query records should return it (some WRN points to it).
    const records = await registry.queryRecords({ type: 'watcher', version: watcher.record.version });
    expect(records).toBeDefined();
    // TODO: Fix queryRecords to return filtered results.
    // expect(records).toHaveLength(1);
  });

  test('Lookup name', async () => {
    const records = await registry.lookupNames([wrn]);
    expect(records).toBeDefined();
    expect(records).toHaveLength(1);

    const [{ latest, history }] = records;
    expect(latest).toBeDefined();
    expect(latest.id).toBeDefined();
    expect(latest.id).toBe(watcherId);
    expect(latest.height).toBeDefined();
    expect(history).toBeUndefined();
  });

  test('Resolve name', async () => {
    const records = await registry.resolveNames([wrn]);
    expect(records).toBeDefined();
    expect(records).toHaveLength(1);

    const [{ attributes }] = records;
    expect(attributes).toEqual(watcher.record);
  });

  test('Lookup name with history', async () => {
    // TODO: Use ensureUpdatedConfig from helper.
    const updatedWatcher = await getBaseConfig(WATCHER_YML_PATH);
    updatedWatcher.record.version = semver.inc(updatedWatcher.record.version, 'patch');
    const result = await registry.setRecord(
      {
        privateKey,
        bondId,
        record: updatedWatcher.record
      },
      accountAddress,
      privateKey,
      fee
    )

    // TODO: Get id from setRecord response.
    // const updatedWatcherId = result.data;
    const updatedWatcherId = WATCHER_2_ID;
    await registry.setName({ wrn, cid: updatedWatcherId }, accountAddress, privateKey, fee);

    const records = await registry.lookupNames([wrn], true);
    expect(records).toHaveLength(1);

    const [{ latest, history }] = records;
    expect(latest).toBeDefined();
    expect(latest.id).toBeDefined();
    expect(latest.id).toBe(updatedWatcherId);
    expect(latest.height).toBeDefined();
    expect(history).toBeDefined();
    expect(history).toHaveLength(1);

    const [oldRecord] = history;
    expect(oldRecord).toBeDefined();
    expect(oldRecord.id).toBeDefined();
    expect(oldRecord.id).toBe(watcherId);
    expect(oldRecord.height).toBeDefined();
  });

  xtest('Set name without reserving authority', async () => {
    await expect(registry.setName({ wrn: 'wrn://not-reserved/app/test', cid: watcherId }, accountAddress, privateKey, fee))
      .rejects.toThrow('Name authority not found.');
  });

  xtest('Set name for non-owned authority', async () => {
    // Create another account.
    const mnenonic = Account.generateMnemonic();
    const otherAccount = await Account.generateFromMnemonic(mnenonic);
    await otherAccount.init()
    // TODO: Get correct account address from private key.
    assert(otherAccount.formattedCosmosAddress);
    otherAccountAddress = otherAccount.formattedCosmosAddress
    await registry.sendCoins({ denom: 'aphoton', amount: '1000000000', destinationAddress: otherAccountAddress }, accountAddress, privateKey, fee);

    // Other account reserves an authority.
    otherAuthorityName = `other-${Date.now()}`;
    otherPrivateKey = otherAccount.privateKey.toString('hex');
    await registry.reserveAuthority({ name: otherAuthorityName, owner: otherAccountAddress }, otherAccountAddress, otherPrivateKey, fee);

    // Try setting name under other authority.
    await expect(registry.setName({ wrn: `wrn://${otherAuthorityName}/app/test`, cid: watcherId }, accountAddress, privateKey, fee)).rejects.toThrow('Access denied.');
  });

  test('Lookup non existing name', async () => {
    const records = await registry.lookupNames(['wrn://not-reserved/app/test']);
    expect(records).toBeDefined();
    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record).toBeNull();
  });

  test('Resolve non existing name', async () => {
    const records = await registry.resolveNames(['wrn://not-reserved/app/test']);
    expect(records).toBeDefined();
    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record).toBeNull();
  });

  test('Delete name', async () => {
    await registry.deleteName({ wrn }, accountAddress, privateKey, fee);

    let records = await registry.lookupNames([wrn], true);
    expect(records).toBeDefined();
    expect(records).toHaveLength(1);

    const [{ latest }] = records;
    expect(latest).toBeDefined();
    expect(latest.id).toBeDefined();
    expect(latest.id).toBe('');
    expect(latest.height).toBeDefined();

    // Query records should NOT return it (no WRN points to it).
    records = await registry.queryRecords({ type: 'watcher', version: watcher.record.version });
    expect(records).toBeDefined();
    // TODO: Fix queryRecords to return filtered results.
    // expect(records).toHaveLength(0);

    // Query all records should return it (all: true).
    records = await registry.queryRecords({ type: 'watcher', version: watcher.record.version }, true);
    expect(records).toBeDefined();
    // expect(records).toHaveLength(1);
  });

  test('Delete already deleted name', async () => {
    await registry.deleteName({ wrn }, accountAddress, privateKey, fee);

    const records = await registry.lookupNames([wrn], true);
    expect(records).toBeDefined();
    expect(records).toBeDefined();
    expect(records).toHaveLength(1);

    const [{ latest }] = records;
    expect(latest).toBeDefined();
    expect(latest.id).toBeDefined();
    expect(latest.id).toBe('');
    expect(latest.height).toBeDefined();
  });

  xtest('Delete name for non-owned authority.', async () => {
    const otherBondId = await registry.getNextBondId(otherPrivateKey);
    await registry.createBond({ denom: 'aphoton', amount: '10000' }, otherAccountAddress, otherPrivateKey, fee);
    await registry.setAuthorityBond({ name: otherAuthorityName, bondId: otherBondId }, otherAccountAddress, otherPrivateKey, fee);
    await registry.setName({ wrn: `wrn://${otherAuthorityName}/app/test`, cid: watcherId }, otherAccountAddress, otherPrivateKey, fee);

    // Try deleting name under other authority.
    await expect(registry.deleteName({ wrn: `wrn://${otherAuthorityName}/app/test` }, accountAddress, privateKey, fee)).rejects.toThrow('Access denied.');
  });
};

if (process.env.AUCTIONS_ENABLED) {
  // Required as jest complains if file has no tests.
  test('skipping naming tests', () => {});
} else {
  describe('Naming', namingTests);
}
