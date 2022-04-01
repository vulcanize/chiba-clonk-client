const DEFAULT_PRIVATE_KEY = '0451f0bd95c855d52e76cdc8dd06f29097b944bfef26d3455725157f9133f4e0';
const DEFAULT_ADDRESS = 'ethm19n3je0lhuk0w9kmkftsuw4etn8lmpu3jjfayeh'

export const getConfig = () => ({
  mockServer: process.env.MOCK_SERVER || false,
  chibaClonk: {
    chainId: process.env.CHIBA_CLONK_CHAIN_ID || 'ethermint_9000-1',
    privateKey: DEFAULT_PRIVATE_KEY,
    accountAddress: DEFAULT_ADDRESS,
    endpoint: process.env.CHIBA_CLONK_ENDPOINT || 'http://localhost:1317',
    fee: {
      amount: '20',
      denom: 'aphoton',
      gas: '200000',
    }
  }
});
