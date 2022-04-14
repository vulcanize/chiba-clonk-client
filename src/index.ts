import isUrl from 'is-url';
import { sha256 } from 'js-sha256';
import { generatePostBodyBroadcast, BroadcastMode } from '@tharsis/provider';
import {
  Chain,
  Sender,
  Fee,
  createMessageSend,
  MessageSendParams
} from '@tharsis/transactions'

import { RegistryClient } from "./registry-client";
import { Account } from "./account";
import { createTransaction } from "./txbuilder";
import { Payload, Record } from './types';
import { Util } from './util';
import {
  createTxMsgCancelBond,
  createTxMsgCreateBond,
  createTxMsgRefillBond,
  createTxMsgWithdrawBond,
  MessageMsgCancelBond,
  MessageMsgCreateBond,
  MessageMsgRefillBond,
  MessageMsgWithdrawBond
} from "./messages/bond";
import {
  createTxMsgDeleteName,
  createTxMsgReserveAuthority,
  createTxMsgSetAuthorityBond,
  createTxMsgSetName,
  createTxMsgSetRecord,
  MessageMsgDeleteName,
  MessageMsgReserveAuthority,
  MessageMsgSetAuthorityBond,
  MessageMsgSetName,
  MessageMsgSetRecord,
  NAMESERVICE_ERRORS
} from './messages/nameservice';
import {
  createTxMsgCommitBid,
  createTxMsgRevealBid,
  MessageMsgCommitBid,
  MessageMsgRevealBid
} from './messages/auction';

const DEFAULT_WRITE_ERROR = 'Unable to write to chiba-clonk.';

export const DEFAULT_CHAIN_ID = 'chibaclonk_9000-1';

// Parse Tx response from cosmos-sdk.
export const parseTxResponse = (result: any) => {
  const { txhash: hash, height, ...txResponse } = result;
  txResponse.data = txResponse.data && Buffer.from(txResponse.data, 'base64').toString('utf8');

  txResponse.events.forEach((event:any) => {
    event.attributes = event.attributes.map(({ key, value }: { key: string, value: string }) => ({
      key: Buffer.from(key, 'base64').toString('utf8'),
      value: Buffer.from(value, 'base64').toString('utf8')
    }));
  });

  return { hash, height, ...txResponse };
};

/**
 * Create an auction bid.
 */
 export const createBid = async (chainId: string, auctionId: string, bidderAddress: string, bidAmount: string, noise?: string) => {
  if (!noise) {
    noise = Account.generateMnemonic();
  }

  const reveal = {
    chainId,
    auctionId,
    bidderAddress,
    bidAmount,
    noise
  };

  const commitHash = await Util.getContentId(reveal);
  const revealString = Buffer.from(JSON.stringify(reveal)).toString('hex');

  return {
    commitHash,
    reveal,
    revealString
  };
};

export const isKeyValid = (key: string) => key && key.match(/^[0-9a-fA-F]{64}$/);

export class Registry {
  _endpoint: string
  _chain: Chain
  _client: RegistryClient

  static processWriteError(error: string) {
    // error string a stacktrace containing the message.
    // https://gist.github.com/nikugogoi/de55d390574ded3466abad8bffd81952#file-txresponse-js-L7
    const errorMessage = NAMESERVICE_ERRORS.find(message => error.includes(message))

    return errorMessage || DEFAULT_WRITE_ERROR;
  }

  constructor(restUrl: string, gqlUrl: string, cosmosChainId = DEFAULT_CHAIN_ID) {
    if (!isUrl(restUrl)) {
      throw new Error('Path to a REST endpoint should be provided.');
    }

    if (!isUrl(gqlUrl)) {
      throw new Error('Path to a GQL endpoint should be provided.');
    }

    this._endpoint = restUrl;
    this._client = new RegistryClient(restUrl, gqlUrl);

    this._chain = {
      chainId: 9000,
      cosmosChainId
    }
  }

  /**
   * Get account by addresses.
   */
  async getAccount(address: string) {
    return this._client.getAccount(address);
  }

  /**
   * Get records by attributes.
   */
  async queryRecords(attributes: {[key: string]: any}, all = false, refs = false) {
    return this._client.queryRecords(attributes, all, refs);
  }

  /**
   * Resolve names to records.
   */
  async resolveNames(names: string[], refs = false) {
    return this._client.resolveNames(names, refs);
  }

  /**
 * Publish record.
 * @param transactionPrivateKey - private key in HEX to sign transaction.
 */
  async setRecord(
    params: { privateKey: string, record: any, bondId: string },
    transactionPrivateKey: string,
    fee: Fee
  ) {
    let result;
    result = await this._submitRecordTx(params, transactionPrivateKey, fee);

    return parseTxResponse(result);
  }

  /**
   * Send coins.
   */
  async sendCoins(params: MessageSendParams, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createMessageSend(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Computes the next bondId for the given account private key.
   */
  async getNextBondId(privateKey: string) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountObj } } = await this.getAccount(account.formattedCosmosAddress);

    const nextSeq = parseInt(accountObj.sequence, 10) + 1;
    result = sha256(`${accountObj.address}:${accountObj.account_number}:${nextSeq}`);

    return result;
  }

  /**
   * Get bonds by ids.
   */
  async getBondsByIds(ids: string[]) {
    return this._client.getBondsByIds(ids);
  }

  /**
   * Query bonds by attributes.
   */
  async queryBonds(attributes = {}) {
    return this._client.queryBonds(attributes);
  }

  /**
   * Create bond.
   */
  async createBond(params: MessageMsgCreateBond, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgCreateBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Refill bond.
   */
  async refillBond(params: MessageMsgRefillBond, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgRefillBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Withdraw (from) bond.
   */
  async withdrawBond(params: MessageMsgWithdrawBond, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgWithdrawBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Cancel bond.
   */
  async cancelBond(params: MessageMsgCancelBond, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgCancelBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Reserve authority.
   */
  async reserveAuthority(params: { name: string, owner?: string }, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msgParams = {
      name: params.name,
      // TODO: Pass empty string as owner.
      owner: params.owner || sender.accountAddress
    }

    const msg = createTxMsgReserveAuthority(this._chain, sender, fee, '', msgParams)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Set authority bond.
   */
  async setAuthorityBond(params: MessageMsgSetAuthorityBond, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgSetAuthorityBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Commit auction bid.
   */
  async commitBid(params: MessageMsgCommitBid, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgCommitBid(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Reveal auction bid.
   */
  async revealBid(params: MessageMsgRevealBid, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgRevealBid(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Get records by ids.
   */
  async getAuctionsByIds(ids: string[]) {
    return this._client.getAuctionsByIds(ids);
  }

  /**
   * Lookup authorities by names.
   */
  async lookupAuthorities(names: string[], auction = false) {
    return this._client.lookupAuthorities(names, auction);
  }

  /**
   * Set name (WRN) to record ID (CID).
   */
  async setName(params: MessageMsgSetName, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgSetName(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Lookup naming information.
   */
  async lookupNames(names: string[], history = false) {
    return this._client.lookupNames(names, history);
  }

  /**
   * Delete name (WRN) mapping.
   */
  async deleteName(params: MessageMsgDeleteName, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgDeleteName(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Submit record transaction.
   * @param privateKey - private key in HEX to sign message.
   * @param txPrivateKey - private key in HEX to sign transaction.
   */
  async _submitRecordTx(
    { privateKey, record, bondId }: { privateKey: string, record: any, bondId: string },
    txPrivateKey: string,
    fee: Fee
  ) {
    if (!isKeyValid(privateKey)) {
      throw new Error('Registry privateKey should be a hex string.');
    }

    if (!isKeyValid(bondId)) {
      throw new Error(`Invalid bondId: ${bondId}.`);
    }

    // Sign record.
    const recordSignerAccount = new Account(Buffer.from(privateKey, 'hex'));
    const registryRecord = new Record(record);
    const payload = new Payload(registryRecord);
    await recordSignerAccount.signPayload(payload);

    // Send record payload Tx.
    return this._submitRecordPayloadTx({ payload, bondId }, txPrivateKey, fee);
  }

  async _submitRecordPayloadTx(params: MessageMsgSetRecord, privateKey: string, fee: Fee) {
    if (!isKeyValid(privateKey)) {
      throw new Error('Registry privateKey should be a hex string.');
    }

    if (!isKeyValid(params.bondId)) {
      throw new Error(`Invalid bondId: ${params.bondId}.`);
    }

    const account = new Account(Buffer.from(privateKey, 'hex'));
    const { account: { base_account: accountInfo } } = await this.getAccount(account.formattedCosmosAddress);

    const sender = {
      accountAddress: account.formattedCosmosAddress,
      sequence: accountInfo.sequence,
      accountNumber: accountInfo.account_number,
      pubkey: account.encodedPubkey,
    }

    const msg = createTxMsgSetRecord(this._chain, sender, fee, '', params)
    return this._submitTx(msg, privateKey, sender);
  }

  /**
   * Submit a generic Tx to the chain.
   */
   async _submitTx(message: any, privateKey: string, sender: Sender) {
    // Check private key.
    if (!isKeyValid(privateKey)) {
      throw new Error('Registry privateKey should be a hex string.');
    }

    // Check that the account exists on-chain.
    const account = new Account(Buffer.from(privateKey, 'hex'));

    // Generate signed Tx.
    const transaction = createTransaction(message, account, sender, this._chain);

    const tx = generatePostBodyBroadcast(transaction, BroadcastMode.Block)

    // Submit Tx to chain.
    const { tx_response: response } = await this._client.submit(tx);

    if (response.code !== 0) {
      // Throw error when transaction is not successful.
      // https://docs.starport.com/guide/nameservice/05-play.html#buy-name-transaction-details
      throw new Error(Registry.processWriteError(response.raw_log))
    }

    return response;
  }
}

export { Account }
