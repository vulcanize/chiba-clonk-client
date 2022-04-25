import {
  generateTypes,
} from '@tharsis/eip712'
import {
  Chain,
  Sender,
  Fee,
} from '@tharsis/transactions'

import * as bondTx from '../proto/vulcanize/bond/v1beta1/tx'
import * as nameserviceTx from '../proto/vulcanize/nameservice/v1beta1/tx'
import * as coin from '../proto/cosmos/base/v1beta1/coin'
import { createTx } from './util'

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

const MSG_WITHDRAW_BOND_TYPES = {
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

const MSG_CANCEL_BOND_TYPES = {
  MsgValue: [
    { name: 'id', type: 'string' },
    { name: 'signer', type: 'string' },
  ]
}

const MSG_ASSOCIATE_BOND_TYPES = {
  MsgValue: [
    { name: 'record_id', type: 'string' },
    { name: 'bond_id', type: 'string' },
    { name: 'signer', type: 'string' },
  ]
}

const MSG_DISSOCIATE_BOND_TYPES = {
  MsgValue: [
    { name: 'record_id', type: 'string' },
    { name: 'signer', type: 'string' },
  ]
}

const MSG_DISSOCIATE_RECORDS_TYPES = {
  MsgValue: [
    { name: 'bond_id', type: 'string' },
    { name: 'signer', type: 'string' },
  ]
}

const MSG_REASSOCIATE_RECORDS_TYPES = {
  MsgValue: [
    { name: 'new_bond_id', type: 'string' },
    { name: 'old_bond_id', type: 'string' },
    { name: 'signer', type: 'string' },
  ]
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

export interface MessageMsgWithdrawBond {
  id: string
  amount: string
  denom: string
}

export interface MessageMsgCancelBond {
  id: string
}

export interface MessageMsgAssociateBond {
  bondId: string,
  recordId: string
}

export interface MessageMsgDissociateBond {
  recordId: string
}

export interface MessageMsgDissociateRecords {
  bondId: string
}

export interface MessageMsgReAssociateRecords {
  newBondId: string
  oldBondId: string
}

export function createTxMsgCreateBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgCreateBond,
) {
  const types = generateTypes(MSG_CREATE_BOND_TYPES)

  const msg = createMsgCreateBond(
    sender.accountAddress,
    params.amount,
    params.denom
  )

  const msgCosmos = protoCreateMsgCreateBond(
    sender.accountAddress,
    params.amount,
    params.denom
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgRefillBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgRefillBond,
) {
  const types = generateTypes(MSG_REFILL_BOND_TYPES)

  const msg = createMsgRefillBond(
    params.id,
    sender.accountAddress,
    params.amount,
    params.denom
  )

  const msgCosmos = protoCreateMsgRefillBond(
    params.id,
    sender.accountAddress,
    params.amount,
    params.denom
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgWithdrawBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgWithdrawBond,
) {
  const types = generateTypes(MSG_WITHDRAW_BOND_TYPES)

  const msg = createMsgWithdrawBond(
    params.id,
    sender.accountAddress,
    params.amount,
    params.denom
  )

  const msgCosmos = protoCreateMsgWithdrawBond(
    params.id,
    sender.accountAddress,
    params.amount,
    params.denom
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgCancelBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgCancelBond,
) {
  const types = generateTypes(MSG_CANCEL_BOND_TYPES)

  const msg = createMsgCancelBond(
    params.id,
    sender.accountAddress
  )

  const msgCosmos = protoCreateMsgCancelBond(
    params.id,
    sender.accountAddress
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgAssociateBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgAssociateBond,
) {
  const types = generateTypes(MSG_ASSOCIATE_BOND_TYPES)

  const msg = createMsgAssociateBond(
    params.recordId,
    params.bondId,
    sender.accountAddress
  )

  const msgCosmos = protoCreateMsgAssociateBond(
    params.recordId,
    params.bondId,
    sender.accountAddress
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgDissociateBond(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgDissociateBond,
) {
  const types = generateTypes(MSG_DISSOCIATE_BOND_TYPES)

  const msg = createMsgDissociateBond(
    params.recordId,
    sender.accountAddress
  )

  const msgCosmos = protoCreateMsgDissociateBond(
    params.recordId,
    sender.accountAddress
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgDissociateRecords(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgDissociateRecords,
) {
  const types = generateTypes(MSG_DISSOCIATE_RECORDS_TYPES)

  const msg = createMsgDissociateRecords(
    params.bondId,
    sender.accountAddress
  )

  const msgCosmos = protoCreateMsgDissociateRecords(
    params.bondId,
    sender.accountAddress
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgReAssociateRecords(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgReAssociateRecords,
) {
  const types = generateTypes(MSG_REASSOCIATE_RECORDS_TYPES)

  const msg = createMsgReAssociateRecords(
    params.newBondId,
    params.oldBondId,
    sender.accountAddress
  )

  const msgCosmos = protoCreateMsgReAssociateRecords(
    params.newBondId,
    params.oldBondId,
    sender.accountAddress
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
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

function createMsgWithdrawBond(
  id: string,
  signer: string,
  amount: string,
  denom: string,
) {
  return {
    type: 'bond/MsgWithdrawBond',
    value: {
      id,
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

const protoCreateMsgWithdrawBond = (
  id: string,
  signer: string,
  amount: string,
  denom: string,
) => {
  const value = new coin.cosmos.base.v1beta1.Coin({
    denom,
    amount,
  })

  const withdrawBondMessage = new bondTx.vulcanize.bond.v1beta1.MsgWithdrawBond({
    id,
    signer,
    coins: [value]
  })

  return {
    message: withdrawBondMessage,
    path: 'vulcanize.bond.v1beta1.MsgWithdrawBond',
  }
}

function createMsgCancelBond(
  id: string,
  signer: string
) {
  return {
    type: 'bond/MsgCancelBond',
    value: {
      id,
      signer
    },
  }
}

const protoCreateMsgCancelBond = (
  id: string,
  signer: string
) => {
  const cancelBondMessage = new bondTx.vulcanize.bond.v1beta1.MsgCancelBond({
    id,
    signer
  })

  return {
    message: cancelBondMessage,
    path: 'vulcanize.bond.v1beta1.MsgCancelBond',
  }
}

function createMsgAssociateBond(
  recordId: string,
  bondId: string,
  signer: string
) {
  return {
    type: 'nameservice/AssociateBond',
    value: {
      record_id: recordId,
      bond_id: bondId,
      signer
    },
  }
}

const protoCreateMsgAssociateBond = (
  recordId: string,
  bondId: string,
  signer: string
) => {
  const associateBondMessage = new nameserviceTx.vulcanize.nameservice.v1beta1.MsgAssociateBond({
    record_id: recordId,
    bond_id: bondId,
    signer
  })

  return {
    message: associateBondMessage,
    path: 'vulcanize.nameservice.v1beta1.MsgAssociateBond',
  }
}

function createMsgDissociateBond(
  recordId: string,
  signer: string
) {
  return {
    type: 'nameservice/DissociateBond',
    value: {
      record_id: recordId,
      signer
    },
  }
}

const protoCreateMsgDissociateBond = (
  recordId: string,
  signer: string
) => {
  const dissociateBondMessage = new nameserviceTx.vulcanize.nameservice.v1beta1.MsgDissociateBond({
    record_id: recordId,
    signer
  })

  return {
    message: dissociateBondMessage,
    path: 'vulcanize.nameservice.v1beta1.MsgDissociateBond',
  }
}

function createMsgDissociateRecords(
  bondId: string,
  signer: string
) {
  return {
    type: 'nameservice/DissociateRecords',
    value: {
      bond_id: bondId,
      signer
    },
  }
}

const protoCreateMsgDissociateRecords = (
  bondId: string,
  signer: string
) => {
  const dissociateRecordsMessage = new nameserviceTx.vulcanize.nameservice.v1beta1.MsgDissociateRecords({
    bond_id: bondId,
    signer
  })

  return {
    message: dissociateRecordsMessage,
    path: 'vulcanize.nameservice.v1beta1.MsgDissociateRecords',
  }
}

function createMsgReAssociateRecords(
  newBondId: string,
  oldBondId: string,
  signer: string
) {
  return {
    type: 'nameservice/ReassociateRecords',
    value: {
      new_bond_id: newBondId,
      old_bond_id: oldBondId,
      signer
    },
  }
}

const protoCreateMsgReAssociateRecords = (
  newBondId: string,
  oldBondId: string,
  signer: string
) => {
  const reAssociateRecordsMessage = new nameserviceTx.vulcanize.nameservice.v1beta1.MsgReAssociateRecords({
    new_bond_id: newBondId,
    old_bond_id: oldBondId,
    signer
  })

  return {
    message: reAssociateRecordsMessage,
    path: 'vulcanize.nameservice.v1beta1.MsgReAssociateRecords',
  }
}
