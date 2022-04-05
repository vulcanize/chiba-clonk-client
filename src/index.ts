
import isUrl from 'is-url';
import { sha256 } from 'js-sha256';
import { generatePostBodyBroadcast } from '@tharsis/provider';
import {
  Chain,
  Sender,
  Fee,
} from '@tharsis/transactions'

import { createTxMsgCancelBond, createTxMsgCreateBond, createTxMsgRefillBond, createTxMsgWithdrawBond, MessageMsgCancelBond, MessageMsgCreateBond, MessageMsgRefillBond, MessageMsgWithdrawBond } from "./bond";
import { RegistryClient } from "./registry-client";
import { Account } from "./account";
import { createTransaction } from "./txbuilder";
import { createTxMsgReserveAuthority, MessageMsgReserveAuthority } from './nameservice';

const DEFAULT_WRITE_ERROR = 'Unable to write to chiba-clonk.';

export const DEFAULT_CHAIN_ID = 'ethermint_9000-1';

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

export const isKeyValid = (key: string) => key && key.match(/^[0-9a-fA-F]{64}$/);

export class Registry {
  _endpoint: string
  _chain: Chain
  _client: RegistryClient

  static processWriteError(error: Error) {
    /**
      Example:

      {
        message: '{"code":18,"data":null,"log":"invalid request: Name already reserved.: failed to execute message; message index: 0","info":"","gasWanted":"200000","gasUsed":"86717","events":[],"codespace":"sdk"}',
          path: [ 'submit' ]
      }g
    */
    const message = JSON.parse(error.message);
    return message.log || DEFAULT_WRITE_ERROR;
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
   * Computes the next bondId for the given account private key.
   */
   async getNextBondId(address: string) {
    let result;

    try {
      const { account } = await this.getAccount(address);
      const accountObj = account.base_account;

      const nextSeq = parseInt(accountObj.sequence, 10) + 1;
      result = sha256(`${accountObj.address}:${accountObj.account_number}:${nextSeq}`);
    } catch (err: any) {
      const error = err[0] || err;
      throw new Error(Registry.processWriteError(error));
    }

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
   async createBond(params: MessageMsgCreateBond, senderAddress: string, privateKey: string, fee: Fee) {
    let result;

    try {
      const { account: { base_account: accountInfo } } = await this.getAccount(senderAddress);

      const sender = {
        accountAddress: accountInfo.address,
        sequence: accountInfo.sequence,
        accountNumber: accountInfo.account_number,
        pubkey: accountInfo.pub_key.key,
      }

      const msg = createTxMsgCreateBond(this._chain, sender, fee, '', params)
      result = await this._submitTx(msg, privateKey, sender);
    } catch (err: any) {
      const error = err[0] || err;
      throw new Error(Registry.processWriteError(error));
    }

    return parseTxResponse(result);
  }

  /**
   * Refill bond.
   */
   async refillBond(params: MessageMsgRefillBond, senderAddress: string, privateKey: string, fee: Fee) {
    let result;

    try {
      const { account: { base_account: accountInfo } } = await this.getAccount(senderAddress);

      const sender = {
        accountAddress: accountInfo.address,
        sequence: accountInfo.sequence,
        accountNumber: accountInfo.account_number,
        pubkey: accountInfo.pub_key.key,
      }

      const msg = createTxMsgRefillBond(this._chain, sender, fee, '', params)
      result = await this._submitTx(msg, privateKey, sender);
    } catch (err: any) {
      const error = err[0] || err;
      throw new Error(Registry.processWriteError(error));
    }

    return parseTxResponse(result);
  }

  /**
   * Withdraw (from) bond.
   */
   async withdrawBond(params: MessageMsgWithdrawBond, senderAddress: string, privateKey: string, fee: Fee) {
    let result;

    try {
      const { account: { base_account: accountInfo } } = await this.getAccount(senderAddress);

      const sender = {
        accountAddress: accountInfo.address,
        sequence: accountInfo.sequence,
        accountNumber: accountInfo.account_number,
        pubkey: accountInfo.pub_key.key,
      }

      const msg = createTxMsgWithdrawBond(this._chain, sender, fee, '', params)
      result = await this._submitTx(msg, privateKey, sender);
    } catch (err: any) {
      const error = err[0] || err;
      throw new Error(Registry.processWriteError(error));
    }

    return parseTxResponse(result);
  }

  /**
   * Cancel bond.
   */
   async cancelBond(params: MessageMsgCancelBond, senderAddress: string, privateKey: string, fee: Fee) {
    let result;

    try {
      const { account: { base_account: accountInfo } } = await this.getAccount(senderAddress);

      const sender = {
        accountAddress: accountInfo.address,
        sequence: accountInfo.sequence,
        accountNumber: accountInfo.account_number,
        pubkey: accountInfo.pub_key.key,
      }

      const msg = createTxMsgCancelBond(this._chain, sender, fee, '', params)
      result = await this._submitTx(msg, privateKey, sender);
    } catch (err: any) {
      const error = err[0] || err;
      throw new Error(Registry.processWriteError(error));
    }

    return parseTxResponse(result);
  }

  /**
   * Reserve authority.
   */
   async reserveAuthority(params: MessageMsgReserveAuthority, senderAddress: string, privateKey: string, fee: Fee) {
    let result;

    try {
      const { account: { base_account: accountInfo } } = await this.getAccount(senderAddress);

      const sender = {
        accountAddress: accountInfo.address,
        sequence: accountInfo.sequence,
        accountNumber: accountInfo.account_number,
        pubkey: accountInfo.pub_key.key,
      }

      const msg = createTxMsgReserveAuthority(this._chain, sender, fee, '', params)
      result = await this._submitTx(msg, privateKey, sender);
    } catch (err: any) {
      const error = err[0] || err;
      throw new Error(Registry.processWriteError(error));
    }

    return parseTxResponse(result);
  }

  /**
   * Lookup authorities by names.
   */
   async lookupAuthorities(names: string[], auction = false) {
    return this._client.lookupAuthorities(names, auction);
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

    const tx = generatePostBodyBroadcast(transaction)

    // Submit Tx to chain.
    const { tx_response: response } = await this._client.submit(tx);
    return response;
  }
}

export { Account }
