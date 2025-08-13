package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/service"
)

// MockVaultClient is a mock implementation of the vault client
type MockVaultClient struct {
	mock.Mock
}

func (m *MockVaultClient) StoreSecret(ctx context.Context, path string, data map[string]interface{}) error {
	args := m.Called(ctx, path, data)
	return args.Error(0)
}

func (m *MockVaultClient) GetSecret(ctx context.Context, path string) (map[string]interface{}, error) {
	args := m.Called(ctx, path)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockVaultClient) DeleteSecret(ctx context.Context, path string) error {
	args := m.Called(ctx, path)
	return args.Error(0)
}

func (m *MockVaultClient) ListSecrets(ctx context.Context, path string) ([]string, error) {
	args := m.Called(ctx, path)
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockVaultClient) Health(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func TestConfigService_CreateAPIKey(t *testing.T) {
	mockVault := new(MockVaultClient)
	configService := service.NewConfigService(mockVault)

	ctx := context.Background()
	serviceName := "test-service"
	description := "Test API key"
	scopes := []string{"read", "write"}
	expiresAt := time.Now().Add(24 * time.Hour)

	// Mock the StoreSecret call
	mockVault.On("StoreSecret", ctx, mock.AnythingOfType("string"), mock.AnythingOfType("map[string]interface {}")).Return(nil)

	// Create API key
	apiKey, err := configService.CreateAPIKey(ctx, serviceName, description, scopes, expiresAt)

	// Assertions
	assert.NoError(t, err)
	assert.NotEmpty(t, apiKey.ID)
	assert.NotEmpty(t, apiKey.Key)
	assert.Equal(t, serviceName, apiKey.ServiceName)
	assert.Equal(t, description, apiKey.Description)
	assert.Equal(t, scopes, apiKey.Scopes)
	assert.True(t, apiKey.IsActive)
	assert.WithinDuration(t, time.Now(), apiKey.CreatedAt, time.Second)

	mockVault.AssertExpectations(t)
}

func TestConfigService_GetAPIKey(t *testing.T) {
	mockVault := new(MockVaultClient)
	configService := service.NewConfigService(mockVault)

	ctx := context.Background()
	keyID := "test-key-id"
	serviceName := "test-service"

	// Mock data
	secretData := map[string]interface{}{
		"id":           keyID,
		"service_name": serviceName,
		"description":  "Test key",
		"key":          "ak_test_key",
		"scopes":       []interface{}{"read", "write"},
		"created_at":   float64(time.Now().Unix()),
		"expires_at":   float64(0),
		"is_active":    true,
		"last_used_at": float64(0),
	}

	// Mock the ListSecrets and GetSecret calls
	mockVault.On("ListSecrets", ctx, "api-keys").Return([]string{serviceName}, nil)
	mockVault.On("GetSecret", ctx, "api-keys/"+serviceName+"/"+keyID).Return(secretData, nil)

	// Get API key
	apiKey, err := configService.GetAPIKey(ctx, keyID)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, keyID, apiKey.ID)
	assert.Equal(t, serviceName, apiKey.ServiceName)
	assert.Equal(t, "Test key", apiKey.Description)
	assert.True(t, apiKey.IsActive)

	mockVault.AssertExpectations(t)
}

func TestConfigService_DeleteAPIKey(t *testing.T) {
	mockVault := new(MockVaultClient)
	configService := service.NewConfigService(mockVault)

	ctx := context.Background()
	keyID := "test-key-id"
	serviceName := "test-service"

	// Mock data for GetAPIKey
	secretData := map[string]interface{}{
		"id":           keyID,
		"service_name": serviceName,
		"description":  "Test key",
		"key":          "ak_test_key",
		"scopes":       []interface{}{"read"},
		"created_at":   float64(time.Now().Unix()),
		"expires_at":   float64(0),
		"is_active":    true,
		"last_used_at": float64(0),
	}

	// Mock the calls
	mockVault.On("ListSecrets", ctx, "api-keys").Return([]string{serviceName}, nil)
	mockVault.On("GetSecret", ctx, "api-keys/"+serviceName+"/"+keyID).Return(secretData, nil)
	mockVault.On("DeleteSecret", ctx, "api-keys/"+serviceName+"/"+keyID).Return(nil)

	// Delete API key
	err := configService.DeleteAPIKey(ctx, keyID)

	// Assertions
	assert.NoError(t, err)

	mockVault.AssertExpectations(t)
}

func TestConfigService_ListAPIKeys(t *testing.T) {
	mockVault := new(MockVaultClient)
	configService := service.NewConfigService(mockVault)

	ctx := context.Background()
	serviceName := "test-service"
	keyID1 := "key-1"
	keyID2 := "key-2"

	// Mock data
	secretData1 := map[string]interface{}{
		"id":           keyID1,
		"service_name": serviceName,
		"description":  "Test key 1",
		"key":          "ak_test_key_1",
		"scopes":       []interface{}{"read"},
		"created_at":   float64(time.Now().Unix()),
		"expires_at":   float64(0),
		"is_active":    true,
		"last_used_at": float64(0),
	}

	secretData2 := map[string]interface{}{
		"id":           keyID2,
		"service_name": serviceName,
		"description":  "Test key 2",
		"key":          "ak_test_key_2",
		"scopes":       []interface{}{"write"},
		"created_at":   float64(time.Now().Unix()),
		"expires_at":   float64(0),
		"is_active":    true,
		"last_used_at": float64(0),
	}

	// Mock the calls
	mockVault.On("ListSecrets", ctx, "api-keys/"+serviceName).Return([]string{keyID1, keyID2}, nil)
	mockVault.On("GetSecret", ctx, "api-keys/"+serviceName+"/"+keyID1).Return(secretData1, nil)
	mockVault.On("GetSecret", ctx, "api-keys/"+serviceName+"/"+keyID2).Return(secretData2, nil)

	// List API keys
	apiKeys, err := configService.ListAPIKeys(ctx, serviceName)

	// Assertions
	assert.NoError(t, err)
	assert.Len(t, apiKeys, 2)
	assert.Equal(t, keyID1, apiKeys[0].ID)
	assert.Equal(t, keyID2, apiKeys[1].ID)
	// Ensure actual keys are not included in list response
	assert.Empty(t, apiKeys[0].Key)
	assert.Empty(t, apiKeys[1].Key)

	mockVault.AssertExpectations(t)
}