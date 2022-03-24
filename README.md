# chiba-clonk-client

## Development

Follow these steps to run the tests:

- After cloning this repo run:

  ```bash
  yarn
  ```

- Clone the [chiba-clonk repo](https://github.com/vulcanize/chiba-clonk) and change directory to repo directory.

- Run the chain using `./init.sh`.

- The mnemonic phrase can be seen in the console at the start just after the script is executed.

- Copy the mnemonic phrase and assign it to variable `MNEMONIC` in the [test file](./src/index.test.ts).

- To export the private key run:

  ```bash
  ethermintd keys export mykey --unarmored-hex --unsafe
  ```

- Copy the private key and assign it to variable `PRIVATE_KEY` in the [test file](./src/index.test.ts).

- Run the test in chiba-clonk-client repo:

  ```bash
  yarn test
  ```

- The account details can be seen using

  ```bash
  ethermintd keys list
  ```
