import assert from 'assert';
import axios from 'axios';
import { generateEndpointAccount, generateEndpointBroadcast, generatePostBodyBroadcast } from '@tharsis/provider';

/**
 * Registry
 */
export class RegistryClient {
  _endpoint: string

  /**
   * New Client.
   * @param {string} endpoint
   * @param {object} options
   */
  constructor(endpoint: string) {
    assert(endpoint);

    this._endpoint = endpoint;
  }

  /**
   * Fetch Account.
   */
   async getAccount(address: string) {
    assert(address);

    let { data } = await axios.get(`${this._endpoint}${generateEndpointAccount(address)}`)

    return data
  }

  /**
   * Submit transaction.
   */
   async submit(tx: string) {
    assert(tx);

    // Broadcast transaction.
    const { data } = await axios.post(
      `${this._endpoint}${generateEndpointBroadcast()}`,
      tx
    )

    return data;
  }
}
