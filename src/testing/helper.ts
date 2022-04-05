import assert from 'assert';

export const getConfig = () => {
  assert(process.env.PRIVATE_KEY);
  assert(process.env.ACCOUNT_ADDRESS);

  return {
    chainId: process.env.CHIBA_CLONK_CHAIN_ID || 'ethermint_9000-1',
    privateKey: process.env.PRIVATE_KEY,
    accountAddress: process.env.ACCOUNT_ADDRESS,
    restEndpoint: process.env.CHIBA_CLONK_REST_ENDPOINT || 'http://localhost:1317',
    gqlEndpoint: process.env.CHIBA_CLONK_GQL_ENDPOINT || 'http://localhost:9473/api',
    fee: {
      amount: '20',
      denom: 'aphoton',
      gas: '200000',
    }
  }
};
