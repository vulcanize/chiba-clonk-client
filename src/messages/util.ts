import { Message } from "google-protobuf";
import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
} from '@tharsis/eip712'
import {
  Chain,
  Sender,
  Fee,
} from '@tharsis/transactions'
import { createTransaction } from '@tharsis/proto'

interface Msg {
  type: string
  value: any
}

interface MsgCosmos {
  message: Message
  path: string
}

interface Types {
  [key: string]: Array<{
    name: string
    type: string
  }>
}

export const createTx = (
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  messageTypes: Types,
  msg: Msg,
  msgCosmos: MsgCosmos,
) => {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(messageTypes)

  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  const eipToSign = createEIP712(types, chain.chainId, messages)

  // Cosmos
  const tx = createTransaction(
    msgCosmos,
    memo,
    fee.amount,
    fee.denom,
    parseInt(fee.gas, 10),
    'ethsecp256',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId,
  )

  return {
    signDirect: tx.signDirect,
    legacyAmino: tx.legacyAmino,
    eipToSign,
  }
}
