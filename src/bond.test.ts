import path from 'path';

import { Registry } from './index';
import { ensureUpdatedConfig, getConfig } from './testing/helper';

const WATCHER_YML_PATH = path.join(__dirname, './testing/data/watcher.yml');

const { chainId, restEndpoint, gqlEndpoint, privateKey, fee } = getConfig();

jest.setTimeout(90 * 1000);

const bondTests = () => {
  let registry: Registry;

  let watcher: any;

  let version1: string;
  let version2: string;

  let bondId1: string;
  let bondId2: string;

  let bondOwner: string;

  const publishNewWatcherVersion = async (bondId: string) => {
    watcher = await ensureUpdatedConfig(WATCHER_YML_PATH);
    await registry.setRecord({ privateKey, record: watcher.record, bondId }, privateKey, fee);
    return watcher.record.version;
  };

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);
  });

  test('Create bond.', async () => {
    bondId1 = await registry.getNextBondId(privateKey);
    expect(bondId1).toBeDefined();
    await registry.createBond({ denom: 'aphoton', amount: '1000000000' }, privateKey, fee);
  })

  test('Get bond by ID.', async () => {
    const [bond] = await registry.getBondsByIds([bondId1]);
    expect(bond).toBeDefined();
    expect(bond.id).toBe(bondId1);
    expect(bond.balance).toHaveLength(1);
    expect(bond.balance[0]).toEqual({ type: 'aphoton', quantity: '1000000000' });
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

  test('Refill bond.', async () => {
    await registry.refillBond({ id: bondId1, denom: 'aphoton', amount: '500' }, privateKey, fee);

    const [bond] = await registry.getBondsByIds([bondId1]);
    expect(bond).toBeDefined();
    expect(bond.id).toBe(bondId1);
    expect(bond.balance).toHaveLength(1);
    expect(bond.balance[0]).toEqual({ type: 'aphoton', quantity: '1000000500' });
  });

  test('Withdraw bond.', async () => {
    await registry.withdrawBond({ id: bondId1, denom: 'aphoton', amount: '500' }, privateKey, fee);

    const [bond] = await registry.getBondsByIds([bondId1]);
    expect(bond).toBeDefined();
    expect(bond.id).toBe(bondId1);
    expect(bond.balance).toHaveLength(1);
    expect(bond.balance[0]).toEqual({ type: 'aphoton', quantity: '1000000000' });
  });

  test('Cancel bond.', async () => {
    await registry.cancelBond({ id: bondId1 }, privateKey, fee);

    const [bond] = await registry.getBondsByIds([bondId1]);
    expect(bond.id).toBe("");
    expect(bond.owner).toBe("");
    expect(bond.balance).toHaveLength(0);
  });

  test('Associate/Dissociate bond.', async () => {
    bondId1 = await registry.getNextBondId(privateKey);
    expect(bondId1).toBeDefined();
    await registry.createBond({ denom: 'aphoton', amount: '1000000000' }, privateKey, fee);

    // Create a new record.
    version1 = await publishNewWatcherVersion(bondId1);
    let [record1] = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version1 }, true);
    expect(record1.bondId).toBe(bondId1);

    // Dissociate record, query and confirm.
    await registry.dissociateBond({ recordId: record1.id }, privateKey, fee);
    [record1] = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version1 }, true);
    expect(record1.bondId).toBe('');

    // Associate record with bond, query and confirm.
    await registry.associateBond({ recordId: record1.id, bondId: bondId1 }, privateKey, fee);
    [record1] = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version1 }, true);
    expect(record1.bondId).toBe(bondId1);
  });

  test('Reassociate/Dissociate records.', async () => {
    // Create a new record version.
    version2 = await publishNewWatcherVersion(bondId1);

    // Check version1, version2 as associated with bondId1.
    let records;
    records = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version1 }, true);
    expect(records[0].bondId).toBe(bondId1);
    records = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version2 }, true);
    expect(records[0].bondId).toBe(bondId1);

    // Create another bond.
    bondId2 = await registry.getNextBondId(privateKey);
    expect(bondId2).toBeDefined();
    await registry.createBond({ denom: 'aphoton', amount: '1000000000' }, privateKey, fee);
    const [bond] = await registry.getBondsByIds([bondId2]);
    expect(bond.id).toBe(bondId2);

    // Reassociate records from bondId1 to bondId2, verify change.
    await registry.reassociateRecords({ oldBondId: bondId1, newBondId: bondId2 }, privateKey, fee);
    records = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version1 }, true);
    expect(records[0].bondId).toBe(bondId2);
    records = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version2 }, true);
    expect(records[0].bondId).toBe(bondId2);

    // Dissociate all records from bond, verify change.
    await registry.dissociateRecords({ bondId: bondId2 }, privateKey, fee);
    records = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version1 }, true);
    expect(records[0].bondId).toBe('');
    records = await registry.queryRecords({ type: watcher.record.type, name: watcher.record.name, version: version2 }, true);
    expect(records[0].bondId).toBe('');
  });
};

describe('Bonds', bondTests);
