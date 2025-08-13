package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

// VaultClient interface for vault operations
type VaultClient interface {
	StoreSecret(ctx context.Context, path string, data map[string]interface{}) error
	GetSecret(ctx context.Context, path string) (map[string]interface{}, error)
	DeleteSecret(ctx context.Context, path string) error
	ListSecrets(ctx context.Context, path string) ([]string, error)
	Health(ctx context.Context) error
}

// APIKey represents an API key
type APIKey struct {
	ID          string    `json:"id"`
	ServiceName string    `json:"service_name"`
	Description string    `json:"description"`
	Key         string    `json:"key,omitempty"` // Only included during creation
	Scopes      []string  `json:"scopes"`
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   time.Time `json:"expires_at,omitempty"`
	IsActive    bool      `json:"is_active"`
	LastUsedAt  time.Time `json:"last_used_at,omitempty"`
}

// ConfigService provides API key management functionality
type ConfigService struct {
	vaultClient VaultClient
}

// NewConfigService creates a new configuration service
func NewConfigService(vaultClient VaultClient) *ConfigService {
	return &ConfigService{
		vaultClient: vaultClient,
	}
}

// CreateAPIKey creates a new API key for a service
func (s *ConfigService) CreateAPIKey(ctx context.Context, serviceName, description string, scopes []string, expiresAt time.Time) (*APIKey, error) {
	// Generate a unique key ID
	keyID, err := generateID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate key ID: %w", err)
	}

	// Generate the actual API key
	apiKey, err := generateAPIKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate API key: %w", err)
	}

	key := &APIKey{
		ID:          keyID,
		ServiceName: serviceName,
		Description: description,
		Key:         apiKey,
		Scopes:      scopes,
		CreatedAt:   time.Now(),
		ExpiresAt:   expiresAt,
		IsActive:    true,
	}

	// Store the API key in Vault
	secretData := map[string]interface{}{
		"id":           key.ID,
		"service_name": key.ServiceName,
		"description":  key.Description,
		"key":          key.Key,
		"scopes":       key.Scopes,
		"created_at":   key.CreatedAt.Unix(),
		"expires_at":   key.ExpiresAt.Unix(),
		"is_active":    key.IsActive,
		"last_used_at": int64(0),
	}

	secretPath := fmt.Sprintf("api-keys/%s/%s", serviceName, keyID)
	if err := s.vaultClient.StoreSecret(ctx, secretPath, secretData); err != nil {
		return nil, fmt.Errorf("failed to store API key in vault: %w", err)
	}

	return key, nil
}

// GetAPIKey retrieves an API key by ID
func (s *ConfigService) GetAPIKey(ctx context.Context, keyID string) (*APIKey, error) {
	// First, try to find the key by searching through services
	// In a real implementation, you might want to maintain an index
	services, err := s.vaultClient.ListSecrets(ctx, "api-keys")
	if err != nil {
		return nil, fmt.Errorf("failed to list services: %w", err)
	}

	for _, serviceName := range services {
		secretPath := fmt.Sprintf("api-keys/%s/%s", serviceName, keyID)
		data, err := s.vaultClient.GetSecret(ctx, secretPath)
		if err != nil {
			continue // Key not found in this service, try next
		}

		return parseAPIKeyFromSecret(data), nil
	}

	return nil, fmt.Errorf("API key not found: %s", keyID)
}

// UpdateAPIKey updates an existing API key
func (s *ConfigService) UpdateAPIKey(ctx context.Context, keyID, description string, scopes []string, expiresAt time.Time) (*APIKey, error) {
	// First get the existing key to find its service
	existingKey, err := s.GetAPIKey(ctx, keyID)
	if err != nil {
		return nil, err
	}

	// Update the key data
	existingKey.Description = description
	existingKey.Scopes = scopes
	existingKey.ExpiresAt = expiresAt

	// Store updated key back to Vault
	secretData := map[string]interface{}{
		"id":           existingKey.ID,
		"service_name": existingKey.ServiceName,
		"description":  existingKey.Description,
		"key":          existingKey.Key,
		"scopes":       existingKey.Scopes,
		"created_at":   existingKey.CreatedAt.Unix(),
		"expires_at":   existingKey.ExpiresAt.Unix(),
		"is_active":    existingKey.IsActive,
		"last_used_at": existingKey.LastUsedAt.Unix(),
	}

	secretPath := fmt.Sprintf("api-keys/%s/%s", existingKey.ServiceName, keyID)
	if err := s.vaultClient.StoreSecret(ctx, secretPath, secretData); err != nil {
		return nil, fmt.Errorf("failed to update API key in vault: %w", err)
	}

	// Don't return the actual key value in the response
	existingKey.Key = ""
	return existingKey, nil
}

// DeleteAPIKey deletes an API key
func (s *ConfigService) DeleteAPIKey(ctx context.Context, keyID string) error {
	// First get the existing key to find its service
	existingKey, err := s.GetAPIKey(ctx, keyID)
	if err != nil {
		return err
	}

	secretPath := fmt.Sprintf("api-keys/%s/%s", existingKey.ServiceName, keyID)
	if err := s.vaultClient.DeleteSecret(ctx, secretPath); err != nil {
		return fmt.Errorf("failed to delete API key from vault: %w", err)
	}

	return nil
}

// ListAPIKeys lists all API keys for a service
func (s *ConfigService) ListAPIKeys(ctx context.Context, serviceName string) ([]*APIKey, error) {
	secretPath := fmt.Sprintf("api-keys/%s", serviceName)
	keyIDs, err := s.vaultClient.ListSecrets(ctx, secretPath)
	if err != nil {
		return nil, fmt.Errorf("failed to list API keys for service %s: %w", serviceName, err)
	}

	var keys []*APIKey
	for _, keyID := range keyIDs {
		keyPath := fmt.Sprintf("api-keys/%s/%s", serviceName, keyID)
		data, err := s.vaultClient.GetSecret(ctx, keyPath)
		if err != nil {
			continue // Skip keys that can't be read
		}

		key := parseAPIKeyFromSecret(data)
		key.Key = "" // Don't include the actual key in list responses
		keys = append(keys, key)
	}

	return keys, nil
}

// generateID generates a unique identifier
func generateID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// generateAPIKey generates a secure API key
func generateAPIKey() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "ak_" + hex.EncodeToString(bytes), nil
}

// parseAPIKeyFromSecret converts Vault secret data to APIKey struct
func parseAPIKeyFromSecret(data map[string]interface{}) *APIKey {
	key := &APIKey{}

	if id, ok := data["id"].(string); ok {
		key.ID = id
	}
	if serviceName, ok := data["service_name"].(string); ok {
		key.ServiceName = serviceName
	}
	if description, ok := data["description"].(string); ok {
		key.Description = description
	}
	if keyValue, ok := data["key"].(string); ok {
		key.Key = keyValue
	}
	if scopes, ok := data["scopes"].([]interface{}); ok {
		key.Scopes = make([]string, len(scopes))
		for i, scope := range scopes {
			if s, ok := scope.(string); ok {
				key.Scopes[i] = s
			}
		}
	}
	if createdAt, ok := data["created_at"].(float64); ok {
		key.CreatedAt = time.Unix(int64(createdAt), 0)
	}
	if expiresAt, ok := data["expires_at"].(float64); ok && expiresAt > 0 {
		key.ExpiresAt = time.Unix(int64(expiresAt), 0)
	}
	if isActive, ok := data["is_active"].(bool); ok {
		key.IsActive = isActive
	}
	if lastUsedAt, ok := data["last_used_at"].(float64); ok && lastUsedAt > 0 {
		key.LastUsedAt = time.Unix(int64(lastUsedAt), 0)
	}

	return key
}