# chiba-clonk-client

## Tests

Follow these steps to run the tests:

- After cloning this repo run:

  ```bash
  yarn
  ```

- Copy [.env.example](./.env.example) file and create a `.env` file.

- Clone the [chiba-clonk repo](https://github.com/vulcanize/chiba-clonk) and change to repo directory.

- Run the chain using `./init.sh`.

- Get the account details using:
  ```bash
  ethermintd keys list
  ```

- Use the address of key `mykey` and assign it to `ACCOUNT_ADDRESS` in the `.env` file.

- To export the private key run:

  ```bash
  ethermintd keys export mykey --unarmored-hex --unsafe
  ```

- Copy the private key and assign it to variable `PRIVATE_KEY` in the `.env` file.

- Run the test in chiba-clonk-client repo:

  ```bash
  yarn test
  ```

## Development

[README](./DEVELOPMENT.md)
