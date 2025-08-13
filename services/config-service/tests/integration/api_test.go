package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/handler"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockVaultClient for integration tests
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

func setupTestRouter() (*gin.Engine, *MockVaultClient) {
	gin.SetMode(gin.TestMode)
	
	mockVault := new(MockVaultClient)
	configService := service.NewConfigService(mockVault)
	apiHandler := handler.NewAPIHandler(configService)
	
	r := gin.New()
	apiHandler.SetupRoutes(r)
	
	return r, mockVault
}

func TestHealthEndpoint(t *testing.T) {
	router, _ := setupTestRouter()
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
	assert.Equal(t, "config-service", response["service"])
}

func TestCreateAPIKeyEndpoint(t *testing.T) {
	router, mockVault := setupTestRouter()
	
	// Mock vault operations
	mockVault.On("StoreSecret", mock.Anything, mock.AnythingOfType("string"), mock.AnythingOfType("map[string]interface {}")).Return(nil)
	
	requestBody := map[string]interface{}{
		"service_name": "test-service",
		"description":  "Test API key",
		"scopes":       []string{"read", "write"},
	}
	
	jsonBody, _ := json.Marshal(requestBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/api-keys", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.NotEmpty(t, response["id"])
	assert.NotEmpty(t, response["api_key"])
	assert.NotEmpty(t, response["created_at"])
	
	mockVault.AssertExpectations(t)
}

func TestCreateAPIKeyValidation(t *testing.T) {
	router, _ := setupTestRouter()
	
	// Test missing service_name
	requestBody := map[string]interface{}{
		"description": "Test API key",
		"scopes":      []string{"read", "write"},
	}
	
	jsonBody, _ := json.Marshal(requestBody)
	
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/api-keys", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "invalid_request", response["error"])
}