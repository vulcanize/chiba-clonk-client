import path from 'path';

import { Registry } from './index';
import { getConfig, ensureUpdatedConfig, provisionBondId } from './testing/helper';

const WATCHER_YML_PATH = path.join(__dirname, './testing/data/watcher.yml');

jest.setTimeout(40 * 1000);

const { chainId, restEndpoint, gqlEndpoint, privateKey, fee } = getConfig();

describe('Querying', () => {
  let watcher: any;
  let registry: Registry;
  let bondId: string;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);
    bondId = await provisionBondId(registry, privateKey, fee);

    const publishNewWatcherVersion = async () => {
      watcher = await ensureUpdatedConfig(WATCHER_YML_PATH);
      await registry.setRecord({ privateKey, record: watcher.record, bondId }, privateKey, fee);
      return watcher.record.version;
    };

    await publishNewWatcherVersion();
  });

  test('Endpoint and chain ID.', async () => {
    expect(registry.endpoints.rest).toBe(restEndpoint);
    expect(registry.endpoints.gql).toBe(gqlEndpoint);
    expect(registry.chainID).toBe(chainId);
  });

  test('Get status.', async () => {
    const status = await registry.getStatus();
    expect(status).toBeDefined();
    expect(status.version).toBeDefined();
  });

  test('List records.', async () => {
    const records = await registry.queryRecords({}, true);
    expect(records.length).toBeGreaterThanOrEqual(1);
  });

  test('Query records by reference.', async () => {
    const { protocol } = watcher.record;
    const records = await registry.queryRecords({ protocol }, true);
    expect(records.length).toBeGreaterThanOrEqual(1);

    const { attributes: { protocol: recordProtocol } } = records[0];
    expect(protocol['/']).toBe(recordProtocol['/']);
  });

  test('Query records by attributes.', async () => {
    const { version, name } = watcher.record;
    const records = await registry.queryRecords({ version, name }, true);
    expect(records.length).toBe(1);

    [ watcher ] = records;
    const { attributes: { version: recordVersion, name: recordName } } = watcher;
    expect(recordVersion).toBe(version);
    expect(recordName).toBe(name);
  });

  test('Query records by id.', async () => {
    const records = await registry.getRecordsByIds([watcher.id]);
    expect(records.length).toBe(1);
    expect(records[0].id).toBe(watcher.id);
  });

  test('Query records passing refs true.', async () => {
    const [record] = await registry.getRecordsByIds([watcher.id], true);
    expect(record.id).toBe(watcher.id);
    expect(record.references).toBeDefined();
    expect(record.references).toHaveLength(1);
  });
});
