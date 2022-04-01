import assert from 'assert';
import {
  createTxRawEIP712,
  signatureToWeb3Extension,
  Chain,
  Sender
} from '@tharsis/transactions'

import { Account } from './account';

/**
 * Generate a cosmos-sdk transaction.
 */
export const createTransaction = (message: any, account: Account, sender: Sender, chain: Chain) => {
  assert(message);
  assert(account);

  // Sign transaction.
  const signature = account.sign(message);

  let extension = signatureToWeb3Extension(chain, sender, signature)

  // Create the txRaw.
  return createTxRawEIP712(message.legacyAmino.body, message.legacyAmino.authInfo, extension)
};
