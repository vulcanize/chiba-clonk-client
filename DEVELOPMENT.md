# Development

## Protobuf

Run following scripts when [proto files](./proto/) are updated.

1. Install dependencies
    ```bash
    yarn
    ```

2. Generate typescript code for the proto files

    ```bash
    ./create-proto-files.sh
    ```

3. Remove GRPC code from generated code

    ```bash
    ./remove-grpc.sh
    ```

    Reference: https://github.com/tharsis/evmosjs/tree/main/packages/proto#note
