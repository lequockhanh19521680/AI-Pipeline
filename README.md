# AI-Dev-Pipeline

A comprehensive, cloud-native microservices architecture for AI/ML workflow orchestration and management.

## 🚀 Features

- **Secure Configuration Management**: API key generation and management with HashiCorp Vault integration
- **Microservices Architecture**: Scalable, maintainable service-oriented design
- **Cloud-Native**: Docker containers with Kubernetes orchestration
- **gRPC & REST APIs**: High-performance service communication and external integration
- **Security First**: Encrypted secrets management and secure service communication
- **CI/CD Ready**: GitHub Actions workflows for automated testing and deployment

## 🏗️ Architecture

The AI-Dev-Pipeline follows a microservices architecture with the following core components:

- **Configuration Service**: Secure API key and configuration management
- **HashiCorp Vault**: Centralized secrets management
- **API Gateway**: Service routing and load balancing (future)
- **AI/ML Services**: Pluggable AI/ML processing services (future)

## 📋 Prerequisites

- Docker and Docker Compose
- Go 1.21+ (for development)
- Kubernetes cluster (for production)
- Protocol Buffers compiler (protoc)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/lequockhanh19521680/AI-Pipeline.git
   cd AI-Pipeline
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running**
   ```bash
   # Check service health
   curl http://localhost:8080/api/v1/health
   
   # Check Vault status
   curl http://localhost:8200/v1/sys/health
   ```

4. **Test the API**
   ```bash
   # Create an API key
   curl -X POST http://localhost:8080/api/v1/api-keys \
     -H "Content-Type: application/json" \
     -d '{
       "service_name": "test-service",
       "description": "Test API key",
       "scopes": ["read", "write"]
     }'
   ```

### Production Deployment

For production deployment on Kubernetes:

```bash
# Deploy namespace
kubectl apply -f k8s/namespace.yaml

# Deploy Vault
kubectl apply -f k8s/vault/

# Create secrets
kubectl create secret generic vault-token \
  --from-literal=token=your-vault-token \
  -n ai-pipeline

# Deploy Configuration Service
kubectl apply -f k8s/config-service/
```

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api-documentation.md)
- [Deployment Guide](docs/deployment.md)

## 🛠️ Development

### Setup Development Environment

1. **Install dependencies**
   ```bash
   cd services/config-service
   go mod download
   ```

2. **Generate protobuf code**
   ```bash
   ./scripts/generate-proto.sh
   ```

3. **Run tests**
   ```bash
   ./scripts/run-tests.sh
   ```

4. **Start the service locally**
   ```bash
   export VAULT_ADDR=http://localhost:8200
   export VAULT_TOKEN=root
   go run main.go
   ```

### Project Structure

```
AI-Pipeline/
├── services/
│   └── config-service/         # Configuration service implementation
│       ├── cmd/               # Application entry points
│       ├── internal/          # Internal packages
│       ├── proto/             # Protocol buffer definitions
│       ├── tests/             # Test files
│       └── scripts/           # Build and deployment scripts
├── k8s/                       # Kubernetes manifests
├── docs/                      # Documentation
├── .github/workflows/         # GitHub Actions CI/CD
└── docker-compose.yml         # Local development setup
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | HTTP server port | `8080` |
| `GRPC_PORT` | gRPC server port | `9090` |
| `VAULT_ADDR` | Vault server address | `http://localhost:8200` |
| `VAULT_TOKEN` | Vault authentication token | `""` |

### Vault Configuration

The system uses HashiCorp Vault for secure secrets management. In development mode, Vault runs with:
- Root token: `root`
- Address: `http://localhost:8200`
- KV secrets engine mounted at `/kv`

## 🧪 Testing

Run the test suite:

```bash
cd services/config-service
go test ./...
```

Run tests with coverage:

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 🚀 API Examples

### Create an API Key

```bash
curl -X POST http://localhost:8080/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "ml-training-service",
    "description": "API key for ML training",
    "scopes": ["read", "write", "execute"]
  }'
```

### List API Keys

```bash
curl http://localhost:8080/api/v1/services/ml-training-service/api-keys
```

### Using gRPC

```go
conn, err := grpc.Dial("localhost:9090", grpc.WithInsecure())
client := pb.NewConfigServiceClient(conn)

resp, err := client.CreateAPIKey(context.Background(), &pb.CreateAPIKeyRequest{
    ServiceName: "my-service",
    Description: "Test API key",
    Scopes: []string{"read", "write"},
})
```

## 🔒 Security

- All sensitive data is stored in HashiCorp Vault
- API keys are generated using cryptographically secure random number generation
- Service communication uses gRPC with optional TLS encryption
- Kubernetes deployment follows security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an issue for bug reports or feature requests
- Check the [documentation](docs/) for detailed guides
- Review the [API documentation](docs/api-documentation.md) for integration details

## 🎯 Roadmap

- [ ] Add API Gateway service
- [ ] Implement AI/ML processing services
- [ ] Add monitoring and observability stack
- [ ] Implement event-driven architecture with message queues
- [ ] Add web-based management dashboard
- [ ] Support for multiple authentication providers