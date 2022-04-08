import assert from 'assert';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import canonicalStringify from 'canonical-json';
import secp256k1 from 'secp256k1';
import { MessageTypes, signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { Ripemd160, Secp256k1 } from "@cosmjs/crypto";
import { fromHex, toBech32, toHex } from '@cosmjs/encoding';
import { rawSecp256k1PubkeyToRawAddress } from "@cosmjs/amino";

import { Payload, Signature } from './types';
import { sha256 } from 'js-sha256';

const AMINO_PREFIX = 'EB5AE98721';
const HDPATH = "m/44'/60'/0'/0";

const bip32 = BIP32Factory(ecc);

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
export class Account {
  _privateKey: Buffer
  _publicKey?: Uint8Array
  _cosmosAddress?: string
  _formattedCosmosAddress?: string
  _registryPublicKey?: string
  _registryAddress?: string

  /**
   * Generate bip39 mnemonic.
   */
  static generateMnemonic() {
    return bip39.generateMnemonic();
  }

  /**
   * Generate private key from mnemonic.
   */
  static async generateFromMnemonic(mnemonic: string) {
    assert(mnemonic);

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const wallet = bip32.fromSeed(seed);
    const account = wallet.derivePath(HDPATH);
    const { privateKey } = account;
    assert(privateKey);

    return new Account(privateKey);
  }

  /**
   * New Account.
   */
  constructor(privateKey: Buffer) {
    assert(privateKey);

    this._privateKey = privateKey;
  }

  get privateKey() {
    return this._privateKey;
  }

  get formattedCosmosAddress() {
    return this._formattedCosmosAddress;
  }

  get registryPublicKey() {
    return this._registryPublicKey;
  }

  get registryAddress() {
    return this._registryAddress;
  }

  async init () {
    // Generate public key.
    const keypair = await Secp256k1.makeKeypair(this._privateKey);

    const compressed = Secp256k1.compressPubkey(keypair.pubkey);
    this._publicKey = compressed

    // 2. Generate cosmos-sdk address.
    this._cosmosAddress = new Ripemd160().update(keypair.pubkey).digest().toString();

    // 3. Generate cosmos-sdk formatted address.
    this._formattedCosmosAddress = toBech32('ethm', rawSecp256k1PubkeyToRawAddress(this._publicKey));

    // 4. Generate registry formatted public key.
    const publicKeyInHex = AMINO_PREFIX + toHex(this._publicKey);
    this._registryPublicKey = Buffer.from(publicKeyInHex, 'hex').toString('base64');

    // 5. Generate registry formatted address.
    let publicKeySha256 = sha256(Buffer.from(publicKeyInHex, 'hex'));
    this._registryAddress = new Ripemd160().update(fromHex(publicKeySha256)).digest().toString();
  }

  /**
   * Get private key.
   */
  getPrivateKey() {
    return this._privateKey.toString('hex');
  }

  /**
   * Get record signature.
   * @param {object} record
   */
  async signRecord(record: any) {
    assert(record);

    const recordAsJson = canonicalStringify(record);
    // Double sha256.
    const recordBytesToSign = Buffer.from(sha256(Buffer.from(sha256(Buffer.from(recordAsJson)), 'hex')), 'hex');

    // Sign message
    assert(recordBytesToSign);

    const messageToSignSha256 = sha256(recordBytesToSign);
    const messageToSignSha256InBytes = Buffer.from(messageToSignSha256, 'hex');
    const sigObj = secp256k1.ecdsaSign(messageToSignSha256InBytes, this.privateKey);

    return Buffer.from(sigObj.signature);
  }

  async signPayload(payload: Payload) {
    assert(payload);

    const { record } = payload;
    const messageToSign = record.getMessageToSign();

    const sig = await this.signRecord(messageToSign);
    assert(this.registryPublicKey)
    const signature = new Signature(this.registryPublicKey, sig.toString('base64'));
    payload.addSignature(signature);

    return signature;
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
