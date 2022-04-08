import assert from 'assert';
import { Validator } from 'jsonschema';

import RecordSchema from './schema/record.json';
import { Util } from './util';

/**
 * Record.
 */
export class Record {
  _record: any

  /**
   * New Record.
   */
  constructor(record: any) {
    assert(record);

    const validator = new Validator();
    const result = validator.validate(record, RecordSchema);
    if (!result.valid) {
      result.errors.map(console.error);
      throw new Error('Invalid record input.');
    }

    this._record = record;
  }

  get attributes() {
    return Buffer.from(JSON.stringify(this._record), 'binary').toString('base64')
  }

  /**
   * Serialize record.
   */
  serialize() {
    // return Util.sortJSON({
    // });
    return {
      'id': '_',
      'bond_id': '_',
      'create_time': '_',
      'expiry_time': '_',
      'deleted': true,
      'attributes': this.attributes,
      // 'owners': [],
    }
  }

  /**
   * Get message to calculate record signature.
   */
  getMessageToSign() {
    return Util.sortJSON(this._record);
  }
}

/**
 * Record Signature.
 */
export class Signature {
  _pubKey: string
  _sig: string

  /**
   * New Signature.
   */
  constructor(pubKey: string, sig: string) {
    assert(pubKey);
    assert(sig);

    this._pubKey = pubKey;
    this._sig = sig;
  }

  /**
   * Serialize Signature.
   */
  serialize() {
    return Util.sortJSON({
      'pub_key': this._pubKey,
      'sig': this._sig
    });
  }
}

/**
 * Message Payload.
 */
export class Payload {
  _record: Record
  _signatures: Signature[]

  /**
   * New Payload.
   */
  constructor(record: Record, ...signatures: Signature[]) {
    assert(record);

    this._record = record;
    this._signatures = signatures;
  }

  get record() {
    return this._record;
  }

  get signatures() {
    return this._signatures;
  }

  /**
   * Add message signature to payload.
   */
  addSignature(signature: any) {
    assert(signature);

    this._signatures.push(signature);
  }

  /**
   * Serialize Payload.
   */
  serialize() {
    // return Util.sortJSON({
    // });
    return {
      'record': this._record.serialize(),
      'signatures': this._signatures.map(s => s.serialize())
    }
  }
}
