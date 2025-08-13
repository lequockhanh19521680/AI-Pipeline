#!/bin/bash

# Generate protobuf Go code
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/config.proto

echo "Protobuf Go code generated successfully"