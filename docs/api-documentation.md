# Configuration Service API Documentation

## Overview

The Configuration Service provides secure API key management capabilities for the AI-Dev-Pipeline system. It offers both REST and gRPC APIs for managing API keys and configuration data.

## Base URLs

- **REST API**: `http://localhost:8080/api/v1`
- **gRPC**: `localhost:9090`

## Authentication

All API endpoints require authentication via API key passed in the `Authorization` header:

```
Authorization: Bearer <api_key>
```

## REST API Endpoints

### Health Check

**GET /api/v1/health**

Check the health status of the service.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1640995200,
  "service": "config-service"
}
```

### Create API Key

**POST /api/v1/api-keys**

Create a new API key for a service.

**Request Body:**
```json
{
  "service_name": "ml-training-service",
  "description": "API key for ML training service",
  "scopes": ["read", "write"],
  "expires_at": 1672531200
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "ak_abcdef1234567890...",
  "created_at": 1640995200
}
```

### Get API Key

**GET /api/v1/api-keys/{id}**

Retrieve metadata for an API key (does not return the actual key).

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "service_name": "ml-training-service",
  "description": "API key for ML training service",
  "scopes": ["read", "write"],
  "created_at": 1640995200,
  "expires_at": 1672531200,
  "is_active": true,
  "last_used_at": 1640995300
}
```

### Update API Key

**PUT /api/v1/api-keys/{id}**

Update an existing API key's metadata.

**Request Body:**
```json
{
  "description": "Updated description",
  "scopes": ["read", "write", "admin"],
  "expires_at": 1672531200
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "service_name": "ml-training-service",
  "description": "Updated description",
  "scopes": ["read", "write", "admin"],
  "created_at": 1640995200,
  "expires_at": 1672531200,
  "is_active": true
}
```

### Delete API Key

**DELETE /api/v1/api-keys/{id}**

Delete an API key.

**Response:**
```json
{
  "success": true
}
```

### List API Keys

**GET /api/v1/services/{service}/api-keys**

List all API keys for a specific service.

**Response:**
```json
{
  "keys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "service_name": "ml-training-service",
      "description": "API key for ML training service",
      "scopes": ["read", "write"],
      "created_at": 1640995200,
      "expires_at": 1672531200,
      "is_active": true,
      "last_used_at": 1640995300
    }
  ]
}
```

## gRPC API

The gRPC API follows the same functionality as the REST API but uses Protocol Buffers for communication. See `proto/config.proto` for the complete service definition.

### Service Definition

```protobuf
service ConfigService {
  rpc CreateAPIKey(CreateAPIKeyRequest) returns (CreateAPIKeyResponse);
  rpc GetAPIKey(GetAPIKeyRequest) returns (GetAPIKeyResponse);
  rpc UpdateAPIKey(UpdateAPIKeyRequest) returns (UpdateAPIKeyResponse);
  rpc DeleteAPIKey(DeleteAPIKeyRequest) returns (DeleteAPIKeyResponse);
  rpc ListAPIKeys(ListAPIKeysRequest) returns (ListAPIKeysResponse);
}
```

## Error Responses

All API endpoints return standardized error responses:

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

### Common Error Codes

- `invalid_request` (400): Invalid request format or missing required fields
- `unauthorized` (401): Invalid or missing authentication
- `forbidden` (403): Insufficient permissions
- `not_found` (404): Resource not found
- `internal_error` (500): Internal server error

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Rate Limit**: 1000 requests per hour per API key
- **Burst Limit**: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640999200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page_size`: Number of items per page (default: 50, max: 100)
- `page_token`: Token for the next page (returned in previous response)

**Response:**
```json
{
  "keys": [...],
  "next_page_token": "eyJwYWdlIjoyLCJzaXplIjo1MH0="
}
```

## SDK Examples

### Go Client Example

```go
package main

import (
    "context"
    "log"
    "google.golang.org/grpc"
    pb "github.com/lequockhanh19521680/AI-Pipeline/services/config-service/proto"
)

func main() {
    conn, err := grpc.Dial("localhost:9090", grpc.WithInsecure())
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    client := pb.NewConfigServiceClient(conn)
    
    resp, err := client.CreateAPIKey(context.Background(), &pb.CreateAPIKeyRequest{
        ServiceName: "my-service",
        Description: "Test API key",
        Scopes: []string{"read", "write"},
    })
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Created API key: %s", resp.ApiKey)
}
```

### cURL Examples

```bash
# Create API key
curl -X POST http://localhost:8080/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "ml-service",
    "description": "Test key",
    "scopes": ["read", "write"]
  }'

# Get API key
curl -X GET http://localhost:8080/api/v1/api-keys/550e8400-e29b-41d4-a716-446655440000

# List API keys for service
curl -X GET http://localhost:8080/api/v1/services/ml-service/api-keys
```