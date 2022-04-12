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

- Export the private key using:

  ```bash
  chibaclonkd keys export mykey --unarmored-hex --unsafe
  ```

- Copy the private key and assign it to variable `PRIVATE_KEY` in the `.env` file.

- Run the tests in chiba-clonk-client repo:

  ```bash
  yarn test
  ```

- Run the tests with auctions enabled

  - In chiba-clonk repo run:

    ```bash
    AUCTION_ENABLED=true ./init.sh
    ```

  - Export the private key and change it in `.env` file again using:

    ```bash
    chibaclonkd keys export mykey --unarmored-hex --unsafe
    ```

  - Run tests:

    ```bash
    yarn test:auctions
    ```

## Development

[README](./DEVELOPMENT.md)
