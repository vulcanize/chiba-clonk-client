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
  createTxMsgAssociateBond,
  createTxMsgCancelBond,
  createTxMsgCreateBond,
  createTxMsgDissociateBond,
  createTxMsgDissociateRecords,
  createTxMsgReAssociateRecords,
  createTxMsgRefillBond,
  createTxMsgWithdrawBond,
  MessageMsgAssociateBond,
  MessageMsgCancelBond,
  MessageMsgCreateBond,
  MessageMsgDissociateBond,
  MessageMsgDissociateRecords,
  MessageMsgReAssociateRecords,
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
  NAMESERVICE_ERRORS,
  parseMsgSetRecordResponse
} from './messages/nameservice';
import {
  createTxMsgCommitBid,
  createTxMsgRevealBid,
  MessageMsgCommitBid,
  MessageMsgRevealBid
} from './messages/auction';

const DEFAULT_WRITE_ERROR = 'Unable to write to chiba-clonk.';

// Parse Tx response from cosmos-sdk.
export const parseTxResponse = (result: any, parseResponse?: (data: string) => any) => {
  const { txhash: hash, height, ...txResponse } = result;

  if (parseResponse) {
    txResponse.data = parseResponse(txResponse.data)
  }

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
  _endpoints: {[key: string]: string}
  _chainID: string
  _chain: Chain
  _client: RegistryClient

  static processWriteError(error: string) {
    // error string a stacktrace containing the message.
    // https://gist.github.com/nikugogoi/de55d390574ded3466abad8bffd81952#file-txresponse-js-L7
    const errorMessage = NAMESERVICE_ERRORS.find(message => error.includes(message))

    if (!errorMessage) {
      console.error(error)
    }

    return errorMessage || DEFAULT_WRITE_ERROR;
  }

  constructor(restUrl: string, gqlUrl: string, chainId: string) {
    if (!isUrl(restUrl)) {
      throw new Error('Path to a REST endpoint should be provided.');
    }

    if (!isUrl(gqlUrl)) {
      throw new Error('Path to a GQL endpoint should be provided.');
    }

    this._endpoints = {
      rest: restUrl,
      gql: gqlUrl
    };

    this._client = new RegistryClient(restUrl, gqlUrl);
    this._chainID = chainId;

    this._chain = {
      cosmosChainId: chainId,
      chainId: this._parseEthChainId(chainId)
    };
  }

  /**
   * Get accounts by addresses.
   */
  async getAccounts(addresses: string[]) {
    return this._client.getAccounts(addresses);
  }

  get endpoints() {
    return this._endpoints;
  }

  get chainID() {
    return this._chainID;
  }

  /**
   * Get server status.
   */
  async getStatus() {
    return this._client.getStatus();
  }

  /**
   * Get records by ids.
   */
  async getRecordsByIds(ids: string[], refs = false) {
    return this._client.getRecordsByIds(ids, refs);
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

    return parseTxResponse(result, parseMsgSetRecordResponse);
  }

  /**
   * Send coins.
   */
  async sendCoins(params: MessageSendParams, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

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
    const accounts = await this.getAccounts([account.formattedCosmosAddress]);
    if (!accounts.length) {
      throw new Error('Account does not exist.');
    }

    const [accountObj] = accounts;
    const nextSeq = parseInt(accountObj.sequence, 10) + 1;
    result = sha256(`${accountObj.address}:${accountObj.number}:${nextSeq}`);

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
    const sender = await this._getSender(account);

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
    const sender = await this._getSender(account);

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
    const sender = await this._getSender(account);

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
    const sender = await this._getSender(account);

    const msg = createTxMsgCancelBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Associate record with bond.
   */
  async associateBond(params: MessageMsgAssociateBond, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

    const msg = createTxMsgAssociateBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Dissociate record from bond.
   */
  async dissociateBond(params: MessageMsgDissociateBond, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

    const msg = createTxMsgDissociateBond(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Dissociate all records from bond.
   */
  async dissociateRecords(params: MessageMsgDissociateRecords, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

    const msg = createTxMsgDissociateRecords(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Reassociate records (switch bond).
   */
  async reassociateRecords(params: MessageMsgReAssociateRecords, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

    const msg = createTxMsgReAssociateRecords(this._chain, sender, fee, '', params)
    result = await this._submitTx(msg, privateKey, sender);

    return parseTxResponse(result);
  }

  /**
   * Reserve authority.
   */
  async reserveAuthority(params: { name: string, owner?: string }, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

    const msgParams = {
      name: params.name,
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
    const sender = await this._getSender(account);

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
    const sender = await this._getSender(account);

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
    const sender = await this._getSender(account);

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
   * Set name (CRN) to record ID (CID).
   */
  async setName(params: MessageMsgSetName, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

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
   * Delete name (CRN) mapping.
   */
  async deleteName(params: MessageMsgDeleteName, privateKey: string, fee: Fee) {
    let result;
    const account = new Account(Buffer.from(privateKey, 'hex'));
    const sender = await this._getSender(account);

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
    const sender = await this._getSender(account);

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

  /**
   * https://evmos.dev/basics/chain_id.html
   */
  _parseEthChainId (chainId: string) {
    const [ idWithChainNumber ] = chainId.split('-')
    const [ _, ethChainId ] = idWithChainNumber.split('_')

    return Number(ethChainId)
  }

  /**
   * Get sender used for creating message.
   */
  async _getSender (account: Account) {
    const accounts = await this.getAccounts([account.formattedCosmosAddress]);
    if (!accounts.length) {
      throw new Error('Account does not exist.');
    }

    const [{ number, sequence }] = accounts;

    return {
      accountAddress: account.formattedCosmosAddress,
      sequence: sequence,
      accountNumber: number,
      pubkey: account.encodedPubkey,
    }
  }
}

export { Account }
