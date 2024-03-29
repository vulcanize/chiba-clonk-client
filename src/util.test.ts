import path from 'path';

import { Registry } from './index';
import { getBaseConfig, getConfig } from './testing/helper';
import { Util } from './util';

const WATCHER_YML_PATH = path.join(__dirname, './testing/data/watcher.yml');

jest.setTimeout(90 * 1000);

const { chainId, restEndpoint, gqlEndpoint, privateKey, fee } = getConfig();

const utilTests = () => {
  let registry: Registry;

  let bondId: string;
  let watcher: any;
  let watcherId: string;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);

    // Create bond.
    bondId = await registry.getNextBondId(privateKey);
    await registry.createBond({ denom: 'aphoton', amount: '1000000000' }, privateKey, fee);

    // Create watcher.
    watcher = await getBaseConfig(WATCHER_YML_PATH);
    const result = await registry.setRecord(
      {
        privateKey,
        bondId,
        record: watcher.record
      },
      privateKey,
      fee
    )

    watcherId = result.data.id;
  });

  test('Generate content id.', async () => {
    const cid = await Util.getContentId(watcher.record);
    expect(cid).toBe(watcherId)
  });
}

describe('Util', utilTests);
