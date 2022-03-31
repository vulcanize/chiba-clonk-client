import { createBond, sendDeposit, sendTokens, sendVote } from './index'

const SENDER_ADDRESS = 'ethm1ztkuzewqh0att04kn4gpkfk7vupmylcp3gr4zj';
const SENDER_PRIVATE_KEY = '765082238ae967c6e6514a7984410dfe268f233959a01c7dc746e8a5ac0faa9a';
const TO_ADDRESS = 'ethm1h3drdgazq4m4gtnxtl6kkuq3cxczrmnq6u24eq';

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

xdescribe('Bond module', () => {
  test('Create bond', async () => {
    const bondParams = {
      amount: '100',
      denom: 'aphoton',
    }

    await createBond(SENDER_PRIVATE_KEY, SENDER_ADDRESS, bondParams)
  })
})
