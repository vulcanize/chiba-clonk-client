import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';
import { fromHex } from '@cosmjs/encoding';

import { sendTokens } from './index'

const MNEMONIC = "talent dismiss teach girl mutual arctic burger matrix outdoor rude vapor rose boost drastic glimpse govern illness rhythm avoid fetch derive increase harvest oak";

const PRIVATE_KEY = "1c6dc846552186ef241489c4e4d10b01086d58b8c2ba06de5dfa589bd52cf23e"

describe('Send tokens', () => {
  test('Create wallet using mnemonic', async () => {
    const path = stringToPath("m/44'/60'/0'/0");

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      MNEMONIC,
      {
        prefix: 'ethm',
        hdPaths: [path]
      }
    );

    await sendTokens(wallet)
  });

  test('Create wallet using private key', async () => {
    const privateKey = fromHex(PRIVATE_KEY);
    const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, 'ethm')

    await sendTokens(wallet)
  });
})
