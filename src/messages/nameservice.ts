import {
  generateTypes,
} from '@tharsis/eip712'
import {
  Chain,
  Sender,
  Fee,
} from '@tharsis/transactions'

import * as nameserviceTx from '../proto/vulcanize/nameservice/v1beta1/tx'
import { createTx } from './util'

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
  const types = generateTypes(MSG_RESERVE_AUTHORITY_TYPES)

  const msg = createMsgReserveAuthority(
    params.name,
    sender.accountAddress,
    params.owner
  )

  const msgCosmos = protoCreateMsgReserveAuthority(
    params.name,
    sender.accountAddress,
    params.owner
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
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
