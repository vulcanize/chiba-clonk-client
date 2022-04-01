import assert from 'assert';
import { MessageTypes, signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { Secp256k1 } from "@cosmjs/crypto";

interface TypedMessageDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: ArrayBuffer;
}

/**
 * Registry account.
 */
// TODO(egor): This is a wrapper around the private key and doesn't have any account related stuff (e.g. account number/sequence). Maybe rename to Key?
export class Account {
  _privateKey: Buffer
  _publicKey?: Uint8Array

  /**
   * New Account.
   * @param {buffer} privateKey
   */
  constructor(privateKey: Buffer) {
    assert(privateKey);

    this._privateKey = privateKey;
  }

  get privateKey() {
    return this._privateKey;
  }

  async init () {
    // Generate public key.
    const keypair = await Secp256k1.makeKeypair(this._privateKey);

    const compressed = Secp256k1.compressPubkey(keypair.pubkey);
    this._publicKey = compressed
  }

  /**
   * Get private key.
   */
  getPrivateKey() {
    return this._privateKey.toString('hex');
  }

  /**
   * Sign message.
   */
  sign(message: any) {
    assert(message);
    const eipMessageDomain: any = message.eipToSign.domain;

    const signature = signTypedData({
      data: {
        types: message.eipToSign.types as MessageTypes,
        primaryType: message.eipToSign.primaryType,
        domain: eipMessageDomain as TypedMessageDomain,
        message: message.eipToSign.message as Record<string, unknown>
      },
      privateKey: this._privateKey,
      version: SignTypedDataVersion.V4
    })

    return signature;
  }
}
