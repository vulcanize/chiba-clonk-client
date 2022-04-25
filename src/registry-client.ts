import assert from 'assert';
import axios from 'axios';
import graphqlClient from 'graphql.js'
import { get, set } from 'lodash'
import { generateEndpointAccount, generateEndpointBroadcast } from '@tharsis/provider';

import { Util } from './util';

const attributeField = `
  attributes {
    key
    value {
      null
      int
      float
      string
      boolean
      json
      reference {
        id
      }
    }
  }
`;

const refsField = `
  references {
    id
  }
`;

const historyFields = `
  history {
    id
    height
  }
`;

const auctionFields = `
  id
  status
  ownerAddress
  createTime
  commitsEndTime
  revealsEndTime
  commitFee {
    type
    quantity
  }
  revealFee {
    type
    quantity
  }
  minimumBid {
    type
    quantity
  }
  winnerAddress
  winnerBid {
    type
    quantity
  }
  winnerPrice {
    type
    quantity
  }
  bids {
    bidderAddress
    status
    commitHash
    commitTime
    revealTime
    commitFee {
      type
      quantity
    }
    revealFee {
      type
      quantity
    }
    bidAmount {
      type
      quantity
    }
  }
`;

/**
 * Registry
 */
export class RegistryClient {
  _restEndpoint: string
  _graph: any

  /**
   * Get query result.
   */
  static async getResult(query: any, key: string, modifier?: (rows: any[]) => {}) {
    const result = await query;
    if (result && result[key] && result[key].length && result[key][0] !== null) {
      if (modifier) {
        return modifier(result[key]);
      }
      return result[key];
    }
    return [];
  }

  /**
   * Prepare response attributes.
   */
  static prepareAttributes(path: string) {
    return (rows: any[]) => {
      const result = rows.map(r => {
        set(r, path, Util.fromGQLAttributes(get(r, path)));
        return r;
      });
      return result;
    };
  }

  /**
   * New Client.
   */
  constructor(restEndpoint: string, gqlEndpoint: string) {
    assert(restEndpoint);

    this._restEndpoint = restEndpoint;

    this._graph = graphqlClient(gqlEndpoint, {
      method: 'POST',
      asJSON: true
    });
  }


  /**
   * Fetch Accounts.
   */
  async getAccounts(addresses: string[]) {
    assert(addresses);
    assert(addresses.length);

    const query = `query ($addresses: [String!]) {
      getAccounts(addresses: $addresses) {
        address
        pubKey
        number
        sequence
        balance {
          type
          quantity
        }
      }
    }`;

    const variables = {
      addresses
    };

    return RegistryClient.getResult(this._graph(query)(variables), 'getAccounts');
  }

  /**
   * Get records by ids.
   */
  async getRecordsByIds(ids: string[], refs = false) {
    assert(ids);
    assert(ids.length);

    const query = `query ($ids: [String!]) {
      getRecordsByIds(ids: $ids) {
        id
        names
        owners
        bondId
        createTime
        expiryTime
        ${attributeField}
        ${refs ? refsField : ''}
      }
    }`;

    const variables = {
      ids
    };

    return RegistryClient.getResult(this._graph(query)(variables), 'getRecordsByIds', RegistryClient.prepareAttributes('attributes'));
  }

  /**
   * Get records by attributes.
   */
  async queryRecords(attributes: {[key: string]: any}, all = false, refs = false) {
    if (!attributes) {
      attributes = {};
    }

    const query = `query ($attributes: [KeyValueInput!], $all: Boolean) {
      queryRecords(attributes: $attributes, all: $all) {
        id
        names
        owners
        bondId
        createTime
        expiryTime
        ${attributeField}
        ${refs ? refsField : ''}
      }
    }`;

    const variables = {
      attributes: Util.toGQLAttributes(attributes),
      all
    };

    let result = (await this._graph(query)(variables))['queryRecords'];
    result = RegistryClient.prepareAttributes('attributes')(result);

    return result;
  }

  /**
   * Lookup authorities by names.
   */
  async lookupAuthorities(names: string[], auction = false) {
    assert(names.length);

    const query = `query ($names: [String!]) {
      lookupAuthorities(names: $names) {
        ownerAddress
        ownerPublicKey
        height
        status
        bondId
        expiryTime
        ${auction ? ('auction { ' + auctionFields + ' }') : ''}
      }
    }`;

    const variables = {
      names
    };

    const result = await this._graph(query)(variables);

    return result['lookupAuthorities'];
  }

  /**
   * Get auctions by ids.
   */
  async getAuctionsByIds(ids: string[]) {
    assert(ids);
    assert(ids.length);

    const query = `query ($ids: [String!]) {
      getAuctionsByIds(ids: $ids) {
        ${auctionFields}
      }
    }`;

    const variables = {
      ids
    };

    return RegistryClient.getResult(this._graph(query)(variables), 'getAuctionsByIds');
  }

  /**
   * Lookup names.
   */
  async lookupNames(names: string[], history = false) {
    assert(names.length);

    const query = `query ($names: [String!]) {
      lookupNames(names: $names) {
        latest {
          id
          height
        }
        ${history ? historyFields : ''}
      }
    }`;

    const variables = {
      names
    };

    const result = await this._graph(query)(variables);

    return result['lookupNames'];
  }

  /**
   * Resolve names to records.
   */
  async resolveNames(names: string[], refs = false) {
    assert(names.length);

    const query = `query ($names: [String!]) {
      resolveNames(names: $names) {
        id
        names
        owners
        bondId
        createTime
        expiryTime
        ${attributeField}
        ${refs ? refsField : ''}
      }
    }`;

    const variables = {
      names
    };

    let result = (await this._graph(query)(variables))['resolveNames'];
    result = RegistryClient.prepareAttributes('attributes')(result);

    return result;
  }

  /**
   * Get bonds by ids.
   */
   async getBondsByIds(ids: string[]) {
    assert(ids);
    assert(ids.length);

    const query = `query ($ids: [String!]) {
      getBondsByIds(ids: $ids) {
        id
        owner
        balance {
          type
          quantity
        }
      }
    }`;

    const variables = {
      ids
    };

    return RegistryClient.getResult(this._graph(query)(variables), 'getBondsByIds');
  }

  /**
   * Get records by attributes.
   */
   async queryBonds(attributes = {}) {
    const query = `query ($attributes: [KeyValueInput!]) {
      queryBonds(attributes: $attributes) {
        id
        owner
        balance {
          type
          quantity
        }
      }
    }`;

    const variables = {
      attributes: Util.toGQLAttributes(attributes)
    };

    return RegistryClient.getResult(this._graph(query)(variables), 'queryBonds');
  }

  /**
   * Submit transaction.
   */
   async submit(tx: string) {
    assert(tx);

    // Broadcast transaction.
    const { data } = await axios.post(
      `${this._restEndpoint}${generateEndpointBroadcast()}`,
      tx
    )

    return data;
  }
}
