# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (for production deployment)
- kubectl configured with cluster access
- HashiCorp Vault (can be deployed as part of the stack)

## Local Development Setup

### 1. Using Docker Compose

The easiest way to run the AI-Pipeline locally is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/lequockhanh19521680/AI-Pipeline.git
cd AI-Pipeline

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs config-service
```

**Services Started:**
- HashiCorp Vault (dev mode): http://localhost:8200
- Configuration Service: http://localhost:8080

### 2. Manual Setup

For development with live reloading:

```bash
# Start Vault in dev mode
docker run -d --name vault \
  -p 8200:8200 \
  -e VAULT_DEV_ROOT_TOKEN_ID=root \
  vault:1.15.2

# Navigate to config service
cd services/config-service

# Install dependencies
go mod download

# Generate protobuf code
./scripts/generate-proto.sh

# Set environment variables
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=root

# Run the service
go run main.go
```

## Production Deployment

### Kubernetes Deployment

#### 1. Prepare the Cluster

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Verify namespace creation
kubectl get namespaces
```

#### 2. Deploy HashiCorp Vault

```bash
# Deploy Vault
kubectl apply -f k8s/vault/

# Wait for Vault to be ready
kubectl wait --for=condition=ready pod -l app=vault -n ai-pipeline --timeout=300s

# Check Vault status
kubectl get pods -n ai-pipeline -l app=vault
```

#### 3. Create Secrets

```bash
# Create Vault token secret
kubectl create secret generic vault-token \
  --from-literal=token=root \
  -n ai-pipeline

# Verify secret creation
kubectl get secrets -n ai-pipeline
```

#### 4. Deploy Configuration Service

```bash
# Deploy config service
kubectl apply -f k8s/config-service/

# Wait for deployment to be ready
kubectl wait --for=condition=available deployment/config-service -n ai-pipeline --timeout=300s

# Check deployment status
kubectl get deployments -n ai-pipeline
kubectl get pods -n ai-pipeline -l app=config-service
```

#### 5. Verify Deployment

```bash
# Check all resources
kubectl get all -n ai-pipeline

# Test the service
kubectl port-forward svc/config-service 8080:80 -n ai-pipeline

# In another terminal, test the health endpoint
curl http://localhost:8080/api/v1/health
```

### Production Considerations

#### Security

1. **Vault Configuration**
   - Use proper Vault configuration (not dev mode)
   - Enable TLS encryption
   - Configure proper authentication backends
   - Set up Vault policies for least privilege access

2. **Kubernetes Security**
   - Use Network Policies to restrict pod-to-pod communication
   - Enable Pod Security Standards
   - Use service accounts with minimal permissions
   - Configure resource limits and requests

3. **Secrets Management**
   - Never store secrets in plain text
   - Use Kubernetes secrets for sensitive data
   - Rotate secrets regularly
   - Audit secret access

#### High Availability

1. **Multiple Replicas**
   ```yaml
   spec:
     replicas: 3  # Increase replica count
   ```

2. **Pod Disruption Budgets**
   ```yaml
   apiVersion: policy/v1
   kind: PodDisruptionBudget
   metadata:
     name: config-service-pdb
   spec:
     minAvailable: 2
     selector:
       matchLabels:
         app: config-service
   ```

3. **Resource Management**
   ```yaml
   resources:
     limits:
       cpu: 1000m
       memory: 1Gi
     requests:
       cpu: 500m
       memory: 512Mi
   ```

#### Monitoring

1. **Health Checks**
   - Liveness probes to restart unhealthy pods
   - Readiness probes to control traffic routing

2. **Logging**
   - Structured logging with correlation IDs
   - Log aggregation with tools like ELK stack or Fluentd

3. **Metrics**
   - Application metrics with Prometheus
   - Infrastructure monitoring with tools like Grafana

## Environment Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | HTTP server port | `8080` |
| `GRPC_PORT` | gRPC server port | `9090` |
| `VAULT_ADDR` | Vault server address | `http://localhost:8200` |
| `VAULT_TOKEN` | Vault authentication token | `""` |
| `VAULT_MOUNT_PATH` | Vault mount path for secrets | `kv` |
| `READ_TIMEOUT` | HTTP read timeout in seconds | `30` |
| `WRITE_TIMEOUT` | HTTP write timeout in seconds | `30` |

### Configuration Files

For production deployments, consider using:
- Kubernetes ConfigMaps for non-sensitive configuration
- Kubernetes Secrets for sensitive data
- Vault for dynamic secrets and encryption keys

## Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   # Check pod logs
   kubectl logs -f deployment/config-service -n ai-pipeline
   
   # Check events
   kubectl get events -n ai-pipeline --sort-by='.lastTimestamp'
   ```

2. **Vault connection issues**
   ```bash
   # Check Vault status
   kubectl exec -it deployment/vault -n ai-pipeline -- vault status
   
   # Verify network connectivity
   kubectl exec -it deployment/config-service -n ai-pipeline -- nslookup vault
   ```

3. **Permission issues**
   ```bash
   # Check service account permissions
   kubectl auth can-i --list --as=system:serviceaccount:ai-pipeline:default -n ai-pipeline
   ```

### Health Checks

```bash
# Health endpoint
curl http://localhost:8080/api/v1/health

# Vault health
curl http://localhost:8200/v1/sys/health
```

### Scaling

```bash
# Scale config service
kubectl scale deployment/config-service --replicas=5 -n ai-pipeline

# Check scaling status
kubectl get pods -n ai-pipeline -l app=config-service
```