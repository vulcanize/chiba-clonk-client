import axios from "axios";
import { MessageTypes, signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";
import { generateEndpointAccount, generateEndpointBroadcast, generatePostBodyBroadcast } from '@tharsis/provider';
import {
  createMessageSend,
  createTxRawEIP712,
  signatureToWeb3Extension,
  createTxMsgVote,
  Chain,
  Sender,
  MessageMsgVote
} from '@tharsis/transactions'

import { createTxMsgDeposit, MessageMsgDeposit } from "./gov";
import { createTxMsgCreateBond, MessageMsgCreateBond } from "./bond";

const ETHERMINT_REST_ENDPOINT = 'http://127.0.0.1:1317'

interface TypedMessageDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: ArrayBuffer;
}

export const sendTokens = async (senderPrivateKey: string, senderAddress: string, destinationAddress: string) => {
  let { data: addrData} = await axios.get(`${ETHERMINT_REST_ENDPOINT}${generateEndpointAccount(senderAddress)}`)

  const chain = {
    chainId: 9000,
    cosmosChainId: 'ethermint_9000-1',
  }

  const sender = {
    accountAddress: addrData.account.base_account.address,
    sequence: addrData.account.base_account.sequence,
    accountNumber: addrData.account.base_account.account_number,
    pubkey: addrData.account.base_account.pub_key.key,
  }

  const fee = {
    amount: '20',
    denom: 'aphoton',
    gas: '200000',
  }

  const memo = ''

  const params = {
    destinationAddress: destinationAddress,
    amount: '10',
    denom: 'aphoton',
  }

  // Create a MsgSend transaction.
  const msg = createMessageSend(chain, sender, fee, memo, params)

  await signAndSendMessage(senderPrivateKey, chain, sender, msg)
}

export const sendVote = async (senderPrivateKey: string, senderAddress: string, params: MessageMsgVote) => {
  let { data: addrData} = await axios.get(`${ETHERMINT_REST_ENDPOINT}${generateEndpointAccount(senderAddress)}`)

  const chain = {
    chainId: 9000,
    cosmosChainId: 'ethermint_9000-1',
  }

  const sender = {
    accountAddress: addrData.account.base_account.address,
    sequence: addrData.account.base_account.sequence,
    accountNumber: addrData.account.base_account.account_number,
    pubkey: addrData.account.base_account.pub_key.key,
  }

  const fee = {
    amount: '20',
    denom: 'aphoton',
    gas: '200000',
  }

  const memo = ''

  const msg = createTxMsgVote(chain, sender, fee, memo, params)
  await signAndSendMessage(senderPrivateKey, chain, sender, msg)
}

export const sendDeposit = async (senderPrivateKey: string, senderAddress: string, params: MessageMsgDeposit) => {
  let { data: addrData} = await axios.get(`${ETHERMINT_REST_ENDPOINT}${generateEndpointAccount(senderAddress)}`)

  const chain = {
    chainId: 9000,
    cosmosChainId: 'ethermint_9000-1',
  }

  const sender = {
    accountAddress: addrData.account.base_account.address,
    sequence: addrData.account.base_account.sequence,
    accountNumber: addrData.account.base_account.account_number,
    pubkey: addrData.account.base_account.pub_key.key,
  }

  const fee = {
    amount: '20',
    denom: 'aphoton',
    gas: '200000',
  }

  const memo = ''

  const msg = createTxMsgDeposit(chain, sender, fee, memo, params)
  await signAndSendMessage(senderPrivateKey, chain, sender, msg)
}

export const createBond = async (senderPrivateKey: string, senderAddress: string, params: MessageMsgCreateBond) => {
  let { data: addrData} = await axios.get(`${ETHERMINT_REST_ENDPOINT}${generateEndpointAccount(senderAddress)}`)

  const chain = {
    chainId: 9000,
    cosmosChainId: 'ethermint_9000-1',
  }

  const sender = {
    accountAddress: addrData.account.base_account.address,
    sequence: addrData.account.base_account.sequence,
    accountNumber: addrData.account.base_account.account_number,
    pubkey: addrData.account.base_account.pub_key.key,
  }

  const fee = {
    amount: '20',
    denom: 'aphoton',
    gas: '200000',
  }

  const memo = ''

  const msg = createTxMsgCreateBond(chain, sender, fee, memo, params)
  await signAndSendMessage(senderPrivateKey, chain, sender, msg)
}

const signAndSendMessage = async (senderPrivateKey: string, chain: Chain, sender: Sender, msg: any) => {
  const eipMessageDomain: any = msg.eipToSign.domain;

  // Sign transaction.
  const signature = signTypedData({
    data: {
      types: msg.eipToSign.types as MessageTypes,
      primaryType: msg.eipToSign.primaryType,
      domain: eipMessageDomain as TypedMessageDomain,
      message: msg.eipToSign.message as Record<string, unknown>
    },
    privateKey: Buffer.from(senderPrivateKey, 'hex'),
    version: SignTypedDataVersion.V4
  })

  let extension = signatureToWeb3Extension(chain, sender, signature)

  // Create the txRaw.
  let rawTx = createTxRawEIP712(msg.legacyAmino.body, msg.legacyAmino.authInfo, extension)

  const body = generatePostBodyBroadcast(rawTx)

  // Broadcast transaction.
  return axios.post(
    `${ETHERMINT_REST_ENDPOINT}${generateEndpointBroadcast()}`,
    JSON.parse(body)
  )

  // TODO: Check for successful broadcast.
}
