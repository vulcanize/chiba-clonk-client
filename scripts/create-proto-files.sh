#!/bin/bash
# NOTE: protoc is required

I=$(pwd)/proto
DEST_TS=$(pwd)/src/proto/
mkdir -p $DEST_TS

protoc \
--plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
--ts_out=$DEST_TS \
--proto_path=$I \
$(find $(pwd)/proto/vulcanize -iname "*.proto")
