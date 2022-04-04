# chiba-clonk-client

## Development

Follow these steps to run the tests:

- After cloning this repo run:

  ```bash
  yarn
  ```

- Clone the [chiba-clonk repo](https://github.com/deep-stack/chiba-clonk) and change to repo directory.

- Checkout to appropriate branch for running tests.

  ```bash
  git checkout ng-chiba-clonk-client
  ```

- Run the chain using `./init.sh`.

- Get the account details using:
  ```bash
  ethermintd keys list
  ```

- Use the address of key `mykey` and assign it to `DEFAULT_ADDRESS` in the [test helper file](./src/testing/helper.ts).

- To export the private key run:

  ```bash
  ethermintd keys export mykey --unarmored-hex --unsafe
  ```

- Copy the private key and assign it to variable `DEFAULT_PRIVATE_KEY` in the [test helper file](./src/testing/helper.ts).

- Run the test in chiba-clonk-client repo:

  ```bash
  yarn test
  ```
