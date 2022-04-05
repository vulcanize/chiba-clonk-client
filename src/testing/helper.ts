const DEFAULT_PRIVATE_KEY = '39e06e1471f69a76491e60d1d22908789bf7801039a9ac2197ed432ad45d2daf';
const DEFAULT_ADDRESS = 'ethm1p9fqwtlypqptuqgndpce5g6wncj4py9z30wfkt'

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
