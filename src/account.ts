import assert from 'assert';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import { MessageTypes, signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';
import { Ripemd160, Secp256k1 } from "@cosmjs/crypto";
import { toBech32 } from '@cosmjs/encoding';
import { rawSecp256k1PubkeyToRawAddress } from "@cosmjs/amino";

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

  async init () {
    // Generate public key.
    const keypair = await Secp256k1.makeKeypair(this._privateKey);

    const compressed = Secp256k1.compressPubkey(keypair.pubkey);
    this._publicKey = compressed

    // 2. Generate cosmos-sdk address.
    // let publicKeySha256 = sha256(this._publicKey);
    this._cosmosAddress = new Ripemd160().update(keypair.pubkey).digest().toString();

    // 3. Generate cosmos-sdk formatted address.
    this._formattedCosmosAddress = toBech32('ethm', rawSecp256k1PubkeyToRawAddress(this._publicKey));
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
