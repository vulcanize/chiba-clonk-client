import { Account } from './account';
import { Registry } from './index';
import { getConfig } from './testing/helper';

const { chainId, restEndpoint, gqlEndpoint, privateKey, fee } = getConfig();

jest.setTimeout(90 * 1000);

const registryTests = () => {
  let registry: Registry;

  beforeAll(async () => {
    registry = new Registry(restEndpoint, gqlEndpoint, chainId);

  });

  test('Get account info.', async() => {
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const accounts = await registry.getAccounts([account.formattedCosmosAddress]);
    expect(accounts).toHaveLength(1)
    const [accountObj] = accounts;
    expect(accountObj.address).toBe(account.formattedCosmosAddress);
    expect(accountObj.pubKey).toBe(account.encodedPubkey);
    expect(accountObj.number).toBe('0');
    expect(accountObj.sequence).toBeDefined();
    expect(accountObj.balance).toHaveLength(1);
    const [{ type, quantity }] = accountObj.balance
    expect(type).toBe('aphoton');
    expect(quantity).toBeDefined();
  })

  test('Get account balance.', async() => {
    const mnenonic1 = Account.generateMnemonic();
    const otherAccount = await Account.generateFromMnemonic(mnenonic1);
    await registry.sendCoins({ denom: 'aphoton', amount: '10000000000000000000000000', destinationAddress: otherAccount.formattedCosmosAddress }, privateKey, fee);

    const [accountObj] = await registry.getAccounts([otherAccount.formattedCosmosAddress]);
    expect(accountObj).toBeDefined();
    expect(accountObj.address).toBe(otherAccount.formattedCosmosAddress);
    const [{ type, quantity }] = accountObj.balance
    expect(type).toBe('aphoton');
    expect(quantity).toBe('10000000000000000000000000');
  })
}

describe('Registry', registryTests);
