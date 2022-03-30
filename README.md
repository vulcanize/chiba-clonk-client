# chiba-clonk-client

## Development

Follow these steps to run the tests:

- After cloning this repo run:

  ```bash
  yarn
  ```

- Clone the [chiba-clonk repo](https://github.com/vulcanize/chiba-clonk) and change directory to repo directory.

- Run the chain using `./init.sh`.

- Add a second account with the following:
  ```bash
  ethermintd keys add <KEY_NAME> --keyring-backend test
  ```

- Get the account details using:
  ```bash
  ethermintd keys list
  ```

- Use the address of key `mykey` as the sender address. Copy the address and assign it to `SENDER_ADDRESS` in the [test file](./src/index.test.ts).

- Copy the address of other account and assign it to variable `TO_ADDRESS` in [test file](./src/index.test.ts).

- To export the sender private key run:

  ```bash
  ethermintd keys export mykey --unarmored-hex --unsafe
  ```

- Copy the private key and assign it to variable `SENDER_PRIVATE_KEY` in the [test file](./src/index.test.ts).

- Perform the following steps for testing gov module:

  - Submit a proposal
    ```bash
    ethermintd tx gov submit-proposal --title="Test Proposal" --description="My awesome proposal" --type="Text" --deposit="10000000aphoton" --from mykey --fees 20aphoton
    ```

  - Query for proposal
    ```bash
    ethermintd query gov proposals
    ```

- Run the test in chiba-clonk-client repo:

  ```bash
  yarn test
  ```

- Check account balances after running test:

  ```bash
  ethermintd query bank balances <ADDRESS>

  # Example
  ethermintd query bank balances ethm1ayxjyxxa3z9z0rjff7rpr67h8aqfgn2t9009zc
  ```

- Check votes for proposal id 1

  ```bash
  # Query votes
  ethermintd query gov votes 1

  # Check votes tally
  ethermintd query gov tally 1
  ```
