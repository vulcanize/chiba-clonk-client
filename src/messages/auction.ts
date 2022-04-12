import {
  generateTypes,
} from '@tharsis/eip712'
import {
  Chain,
  Sender,
  Fee,
} from '@tharsis/transactions'

import * as auctionTx from '../proto/vulcanize/auction/v1beta1/tx'
import { createTx } from './util'

const MSG_COMMIT_BID_TYPES = {
  MsgValue: [
    { name: 'auction_id', type: 'string' },
    { name: 'commit_hash', type: 'string' },
    { name: 'signer', type: 'string' },
  ]
}

export interface MessageMsgCommitBid {
  auctionId: string,
  commitHash: string,
}

const MSG_REVEAL_BID_TYPES = {
  MsgValue: [
    { name: 'auction_id', type: 'string' },
    { name: 'reveal', type: 'string' },
    { name: 'signer', type: 'string' },
  ]
}

export interface MessageMsgRevealBid {
  auctionId: string,
  reveal: string,
}

export function createTxMsgCommitBid(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgCommitBid,
) {
  const types = generateTypes(MSG_COMMIT_BID_TYPES)

  const msg = createMsgCommitBid(
    params.auctionId,
    params.commitHash,
    sender.accountAddress,
  )

  const msgCosmos = protoCreateMsgCommitBid(
    params.auctionId,
    params.commitHash,
    sender.accountAddress,
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

export function createTxMsgRevealBid(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgRevealBid,
) {
  const types = generateTypes(MSG_REVEAL_BID_TYPES)

  const msg = createMsgRevealBid(
    params.auctionId,
    params.reveal,
    sender.accountAddress,
  )

  const msgCosmos = protoCreateMsgRevealBid(
    params.auctionId,
    params.reveal,
    sender.accountAddress,
  )

  return createTx(chain, sender, fee, memo, types, msg, msgCosmos)
}

function createMsgCommitBid(
  auctionId: string,
  commitHash: string,
  signer: string
) {
  return {
    type: 'auction/MsgCommitBid',
    value: {
      auction_id: auctionId,
      commit_hash: commitHash,
      signer,
    },
  }
}

const protoCreateMsgCommitBid = (
  auctionId: string,
  commitHash: string,
  signer: string
) => {
  const commitBidMessage = new auctionTx.vulcanize.auction.v1beta1.MsgCommitBid({
    auction_id: auctionId,
    commit_hash: commitHash,
    signer,
  })

  return {
    message: commitBidMessage,
    path: 'vulcanize.auction.v1beta1.MsgCommitBid',
  }
}

function createMsgRevealBid(
  auctionId: string,
  reveal: string,
  signer: string
) {
  return {
    type: 'auction/MsgRevealBid',
    value: {
      auction_id: auctionId,
      reveal,
      signer,
    },
  }
}

const protoCreateMsgRevealBid = (
  auctionId: string,
  reveal: string,
  signer: string
) => {
  const revealBidMessage = new auctionTx.vulcanize.auction.v1beta1.MsgRevealBid({
    auction_id: auctionId,
    reveal,
    signer,
  })

  return {
    message: revealBidMessage,
    path: 'vulcanize.auction.v1beta1.MsgRevealBid',
  }
}
