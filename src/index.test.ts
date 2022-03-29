import { sendTokens } from './index'

const SENDER_ADDRESS = 'ethm1ayxjyxxa3z9z0rjff7rpr67h8aqfgn2t9009zc';
const SENDER_PRIVATE_KEY = '5041b1ace7ea207794f4c5c1c5f987ff8a9d782f194ef5b24bcffaafaf4a019f';
const TO_ADDRESS = 'ethm12x63cgg82ek97cf8ew9hf6r7je75s5w2smejqv';

test('Send tokens', async () => {
  await sendTokens(SENDER_PRIVATE_KEY, SENDER_ADDRESS, TO_ADDRESS)
});
