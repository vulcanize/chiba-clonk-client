const DEFAULT_PRIVATE_KEY = '3d8e23810daecb66ec4ca97805f6bbfc102015c3f22cdda1a783b1d074c43bdd';
const DEFAULT_ADDRESS = 'ethm1lrdrh056ce23h9d9d5rx34tp0uwj0u9zumynx3'

export const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

export const getConfig = () => ({
  mockServer: process.env.MOCK_SERVER || false,
  chibaClonk: {
    chainId: process.env.CHIBA_CLONK_CHAIN_ID || 'ethermint_9000-1',
    privateKey: DEFAULT_PRIVATE_KEY,
    accountAddress: DEFAULT_ADDRESS,
    restEndpoint: process.env.CHIBA_CLONK_REST_ENDPOINT || 'http://localhost:1317',
    gqlEndpoint: process.env.CHIBA_CLONK_GQL_ENDPOINT || 'http://localhost:9473/api',
    fee: {
      amount: '20',
      denom: 'aphoton',
      gas: '200000',
    }
  }
});
