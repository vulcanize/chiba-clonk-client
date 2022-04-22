import path from 'path';

import { Registry } from './index';
import { ensureUpdatedConfig, getConfig } from './testing/helper';

const WATCHER_YML_PATH = path.join(__dirname, './testing/data/watcher.yml');

jest.setTimeout(120 * 1000);

const { chainId, restEndpoint, gqlEndpoint, privateKey, fee } = getConfig();

const nameserviceExpiryTests = () => {
  let registry: Registry;

  let bondId: string;
  let watcher: any;

  let authorityName: string;
  let authorityExpiryTime: Date;
  let recordExpiryTime: Date;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);

    // Create bond.
    bondId = await registry.getNextBondId(privateKey);
    await registry.createBond({ denom: 'aphoton', amount: '3000000' }, privateKey, fee);
  });

  test('Set record and check bond balance', async () => {
    // Create watcher.
    watcher = await ensureUpdatedConfig(WATCHER_YML_PATH);
    await registry.setRecord(
      {
        privateKey,
        bondId,
        record: watcher.record
      },
      privateKey,
      fee
    )

    const [record] = await registry.queryRecords({ type: 'watcher', version: watcher.record.version }, true);
    recordExpiryTime = new Date(record.expiryTime);

    const [bond] = await registry.getBondsByIds([bondId]);
    expect(bond).toBeDefined();
    expect(bond.balance).toHaveLength(1);
    expect(bond.balance[0].quantity).toBe('2000000');
  })

  test('Reserve authority and set bond', async () => {
    authorityName = `chiba-clonk-${Date.now()}`;
    await registry.reserveAuthority({ name: authorityName }, privateKey, fee);
    await registry.setAuthorityBond({ name: authorityName, bondId }, privateKey, fee);
    const [authority] = await registry.lookupAuthorities([authorityName]);
    expect(authority.status).toBe('active');
    authorityExpiryTime = new Date(authority.expiryTime);
  });

  test('Wait for expiry duration', (done) => {
    setTimeout(done, 60 * 1000);
  });

  test('Check record expiry time', async() => {
    const [record] = await registry.queryRecords({ type: 'watcher', version: watcher.record.version }, true);
    const updatedExpiryTime = new Date(record.expiryTime);
    expect(updatedExpiryTime.getTime()).toBeGreaterThan(recordExpiryTime.getTime());
    recordExpiryTime = updatedExpiryTime;
  })

  test('Check authority expiry time', async() => {
    const [authority] = await registry.lookupAuthorities([authorityName]);
    const updatedExpiryTime = new Date(authority.expiryTime);
    expect(updatedExpiryTime.getTime()).toBeGreaterThan(authorityExpiryTime.getTime());
    authorityExpiryTime = updatedExpiryTime;
  })

  test('Check bond balance', async () => {
    const [bond] = await registry.getBondsByIds([bondId]);
    expect(bond).toBeDefined();
    expect(bond.balance).toHaveLength(0);
  })

  test('Wait for expiry duration', (done) => {
    setTimeout(done, 60 * 1000);
  });

  test('Check record deleted without bond balance', async() => {
    const records = await registry.queryRecords({ type: 'watcher', version: watcher.record.version }, true);
    expect(records).toHaveLength(0);
  })

  test('Check authority expired without bond balance', async() => {
    const [authority] = await registry.lookupAuthorities([authorityName]);
    expect(authority.status).toBe('expired');
  })
}

if (!process.env.TEST_NAMESERVICE_EXPIRY) {
  // Required as jest complains if file has no tests.
  test('skipping nameservice expiry tests', () => {});
} else {
  /**
    Running these tests requires timers to be set. In chiba-clonk repo run:

    TEST_NAMESERVICE_EXPIRY=true ./init.sh


    Run tests:

    yarn test:nameservice-expiry
  */

  describe('Nameservice Expiry', nameserviceExpiryTests)
}
