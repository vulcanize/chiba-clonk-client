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

import * as bondTx from './proto/vulcanize/bond/v1beta1/tx'
import * as coin from './proto/cosmos/base/v1beta1/coin'

const MSG_CREATE_BOND_TYPES = {
  MsgValue: [
    { name: 'signer', type: 'string' },
    { name: 'coins', type: 'TypeCoins[]' },
  ],
  TypeCoins: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' },
  ],
}

const MSG_REFILL_BOND_TYPES = {
  MsgValue: [
    { name: 'id', type: 'string' },
    { name: 'signer', type: 'string' },
    { name: 'coins', type: 'TypeCoins[]' },
  ],
  TypeCoins: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' },
  ],
}

export interface MessageMsgCreateBond {
  amount: string
  denom: string
}

export interface MessageMsgRefillBond {
  id: string,
  amount: string
  denom: string
}

export function createTxMsgCreateBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgCreateBond,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_CREATE_BOND_TYPES)

  const msg = createMsgCreateBond(
    sender.accountAddress,
    params.amount,
    params.denom
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
  const msgCosmos = protoCreateMsgCreateBond(
    sender.accountAddress,
    params.amount,
    params.denom
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

export function createTxMsgRefillBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgRefillBond,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_REFILL_BOND_TYPES)

  const msg = createMsgRefillBond(
    params.id,
    sender.accountAddress,
    params.amount,
    params.denom
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
  const msgCosmos = protoCreateMsgRefillBond(
    params.id,
    sender.accountAddress,
    params.amount,
    params.denom
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

function createMsgCreateBond(
  signer: string,
  amount: string,
  denom: string,
) {
  return {
    type: 'bond/MsgCreateBond',
    value: {
      coins: [
        {
          amount,
          denom,
        },
      ],
      signer
    },
  }
}

const protoCreateMsgCreateBond = (
  signer: string,
  amount: string,
  denom: string,
) => {
  const value = new coin.cosmos.base.v1beta1.Coin({
    denom,
    amount,
  })

  const createBondMessage = new bondTx.vulcanize.bond.v1beta1.MsgCreateBond({
    signer,
    coins: [value]
  })

  return {
    message: createBondMessage,
    path: 'vulcanize.bond.v1beta1.MsgCreateBond',
  }
}

function createMsgRefillBond(
  id: string,
  signer: string,
  amount: string,
  denom: string,
) {
  return {
    type: 'bond/MsgRefillBond',
    value: {
      coins: [
        {
          amount,
          denom,
        },
      ],
      id,
      signer
    },
  }
}

const protoCreateMsgRefillBond = (
  id: string,
  signer: string,
  amount: string,
  denom: string,
) => {
  const value = new coin.cosmos.base.v1beta1.Coin({
    denom,
    amount,
  })

  const refillBondMessage = new bondTx.vulcanize.bond.v1beta1.MsgRefillBond({
    id,
    signer,
    coins: [value]
  })

  return {
    message: refillBondMessage,
    path: 'vulcanize.bond.v1beta1.MsgRefillBond',
  }
}
