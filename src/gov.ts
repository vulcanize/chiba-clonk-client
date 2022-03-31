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
import * as govTx from '@tharsis/proto/dist/proto/cosmos/gov/v1beta1/tx'
import * as coin from '@tharsis/proto/dist/proto/cosmos/base/v1beta1/coin'

const MSG_DEPOSIT_TYPES = {
  MsgValue: [
    { name: 'proposal_id', type: 'uint64' },
    { name: 'depositor', type: 'string' },
    { name: 'amount', type: 'TypeAmount[]' },
  ],
  TypeAmount: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' },
  ],
}

export interface MessageMsgDeposit {
  proposalId: number
  amount: string
  denom: string
}

export function createTxMsgDeposit(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgDeposit,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_DEPOSIT_TYPES)

  const msg = createMsgDeposit(
    params.proposalId,
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
  const msgCosmos = protoCreateMsgDeposit(
    params.proposalId,
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

function createMsgDeposit(
  proposalId: number,
  depositor: string,
  amount: string,
  denom: string,
) {
  return {
    type: 'cosmos-sdk/MsgDeposit',
    value: {
      proposal_id: proposalId,
      depositor,
      amount: [
        {
          amount,
          denom,
        },
      ],
    },
  }
}

const protoCreateMsgDeposit = (
  proposalId: number,
  depositor: string,
  amount: string,
  denom: string,
) => {
  const value = new coin.cosmos.base.v1beta1.Coin({
    denom,
    amount,
  })

  const depositMessage = new govTx.cosmos.gov.v1beta1.MsgDeposit({
    proposal_id: proposalId,
    depositor,
    amount: [value]
  })

  return {
    message: depositMessage,
    path: 'cosmos.gov.v1beta1.MsgDeposit',
  }
}
