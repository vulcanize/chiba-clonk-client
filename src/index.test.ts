import { createBond, sendDeposit, sendTokens, sendVote } from './index'

const SENDER_ADDRESS = 'ethm1kgwzff36qmx5tvfvfr7wvdurp5mr25csyqxgdm';
const SENDER_PRIVATE_KEY = '12e94bcc0daecd936b499f3eeb3b3b76ac1410cbaff2ee6c6f64d768453db0cf';
const TO_ADDRESS = 'ethm1e6r855un2ufnne9cdpujvan5srxjand37pepuz';

test('Send tokens', async () => {
  await sendTokens(SENDER_PRIVATE_KEY, SENDER_ADDRESS, TO_ADDRESS)
});

describe('Gov module', () => {
  test('Send deposit', async () => {
    const depositParams = {
      proposalId: 1,
      amount: '10',
      denom: 'aphoton',
    }

    await sendDeposit(SENDER_PRIVATE_KEY, SENDER_ADDRESS, depositParams)
  })

  test('Send vote', async () => {
    const voteParams = {
      proposalId: 1,
      option: 1
    }

    await sendVote(SENDER_PRIVATE_KEY, SENDER_ADDRESS, voteParams)
  })
})

describe('Bond module', () => {
  test('Create bond', async () => {
    const bondParams = {
      amount: '100',
      denom: 'aphoton',
    }

    await createBond(SENDER_PRIVATE_KEY, SENDER_ADDRESS, bondParams)
  })
})
