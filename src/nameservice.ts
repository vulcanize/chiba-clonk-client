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

import * as nameserviceTx from './proto/vulcanize/nameservice/v1beta1/tx'

const MSG_RESERVE_AUTHORITY_TYPES = {
  MsgValue: [
    { name: 'name', type: 'string' },
    { name: 'signer', type: 'string' },
    { name: 'owner', type: 'string' },
  ],
}

export interface MessageMsgReserveAuthority {
  name: string
  owner: string
}

export function createTxMsgReserveAuthority(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgReserveAuthority,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_RESERVE_AUTHORITY_TYPES)

  const msg = createMsgReserveAuthority(
    params.name,
    sender.accountAddress,
    params.owner
  )

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
  const msgCosmos = protoCreateMsgReserveAuthority(
    params.name,
    sender.accountAddress,
    params.owner
  )

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

function createMsgReserveAuthority(
  name: string,
  signer: string,
  owner: string
) {
  return {
    type: 'nameservice/ReserveAuthority',
    value: {
      name,
      signer,
      owner
    },
  }
}

const protoCreateMsgReserveAuthority = (
  name: string,
  signer: string,
  owner: string,
) => {
  const reserveAuthorityMessage = new nameserviceTx.vulcanize.nameservice.v1beta1.MsgReserveAuthority({
    name,
    signer,
    owner
  })

  return {
    message: reserveAuthorityMessage,
    path: 'vulcanize.nameservice.v1beta1.MsgReserveAuthority',
  }
}
