import assert from 'assert';

import { Registry, Account } from './index';
import { getConfig } from './testing/helper';

jest.setTimeout(30 * 60 * 1000);

const { chainId, restEndpoint, gqlEndpoint, privateKey, accountAddress, fee } = getConfig();

const auctionTests = (numBidders = 3) => {
  let registry: Registry;

  const accounts: { address: string, privateKey: string }[] = [];

  let auctionId: string;
  let authorityName: string;

  beforeAll(async () => {
    console.log('Running auction tests with num bidders', numBidders);

    registry = new Registry(restEndpoint, gqlEndpoint, chainId);
  });

  test('Setup bidder accounts', async () => {
    for (let i = 0; i < numBidders; i++) {
      const mnenonic = Account.generateMnemonic();
      const account = await Account.generateFromMnemonic(mnenonic);
      await account.init();
      const bidderAddress = account.formattedCosmosAddress;
      assert(bidderAddress)
      await registry.sendCoins({ denom: 'uwire', amount: '1000000000', destinationAddress: bidderAddress }, accountAddress, privateKey, fee);
      accounts.push({ address: bidderAddress, privateKey: account.privateKey.toString('hex') });
    }

    accounts.unshift({ address: accountAddress, privateKey });
  });

  test('Reserve authority.', async () => {
    authorityName = `dxos-${Date.now()}`;
    await registry.reserveAuthority({ name: authorityName, owner: accounts[0].address }, accounts[0].address, accounts[0].privateKey, fee);
  });

  test('Authority should be under auction.', async () => {
    const [record] = await registry.lookupAuthorities([authorityName], true);
    expect(record.ownerAddress).toEqual('');
    expect(record.height).toBeDefined();
    expect(record.status).toEqual('auction');

    expect(record.auction.id).toBeDefined();
    expect(record.auction.status).toEqual('commit');

    auctionId = record.auction.id;
  });
};

const withNumBidders = (numBidders: number) => () => auctionTests(numBidders);

if (!process.env.AUCTIONS_ENABLED) {
  // Required as jest complains if file has no tests.
  test('skipping auction tests', () => {});
} else {
  /**
    Running these tests requires name auctions enabled. In chiba-clonk repo run:

    AUCTION_ENABLED=true ./init.sh


    Run tests:

    yarn test:auctions
  */
  describe('Auction (1 bidder)', withNumBidders(1));
  describe('Auction (2 bidders)', withNumBidders(2));
  describe('Auction (4 bidders)', withNumBidders(4));
}
