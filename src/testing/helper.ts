const DEFAULT_PRIVATE_KEY = '794ce0bf3c75571416001c3415e69059aeba54038bcac8ce5b9792259e6d193b';
const DEFAULT_ADDRESS = 'ethm10atmndy7sm46829rc3yr7cxqucgrz5e9jg58xp'

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
