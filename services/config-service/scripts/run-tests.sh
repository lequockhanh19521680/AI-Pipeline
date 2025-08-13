#!/bin/bash

echo "Running tests for Config Service..."

# Run unit tests
echo "Running unit tests..."
go test ./tests/unit/... -v

# Run integration tests (if vault is available)
echo "Running integration tests..."
go test ./tests/integration/... -v

# Run tests with coverage
echo "Running tests with coverage..."
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html

echo "Test results saved to coverage.html"