import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { assertIsDeliverTxSuccess, SigningStargateClient } from "@cosmjs/stargate";

const RPC_ENDPOINT = "http://127.0.0.1:26657"

export const sendTokens = async (wallet: OfflineDirectSigner) => {
  const [firstAccount] = await wallet.getAccounts();
  console.log("account", firstAccount)

  const client = await SigningStargateClient.connectWithSigner(RPC_ENDPOINT, wallet, { prefix: 'ethm' });

  const senderAddress = firstAccount.address
  const recipient = "ethm1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5";

  const amount = {
    denom: "ethm",
    amount: "12345",
  };

  const sendMsg = {
    typeUrl: "/ethm.bank.v1beta1.MsgSend",
    value: {
      fromAddress: senderAddress,
      toAddress: recipient,
      amount: [amount],
    },
  };

  const defaultFee = {
    amount: [],
    gas: "200000",
  };

  const result = await client.signAndBroadcast(senderAddress, [sendMsg], defaultFee);
  assertIsDeliverTxSuccess(result);
}
