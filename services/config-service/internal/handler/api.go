package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/service"
)

// APIHandler handles HTTP API requests
type APIHandler struct {
	configService *service.ConfigService
}

// NewAPIHandler creates a new API handler
func NewAPIHandler(configService *service.ConfigService) *APIHandler {
	return &APIHandler{
		configService: configService,
	}
}

// SetupRoutes sets up the HTTP routes
func (h *APIHandler) SetupRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.POST("/api-keys", h.CreateAPIKey)
		api.GET("/api-keys/:id", h.GetAPIKey)
		api.PUT("/api-keys/:id", h.UpdateAPIKey)
		api.DELETE("/api-keys/:id", h.DeleteAPIKey)
		api.GET("/services/:service/api-keys", h.ListAPIKeys)
		api.GET("/health", h.Health)
	}
}

// CreateAPIKeyRequest represents the request to create an API key
type CreateAPIKeyRequest struct {
	ServiceName string   `json:"service_name" binding:"required"`
	Description string   `json:"description"`
	Scopes      []string `json:"scopes"`
	ExpiresAt   int64    `json:"expires_at,omitempty"`
}

// UpdateAPIKeyRequest represents the request to update an API key
type UpdateAPIKeyRequest struct {
	Description string   `json:"description"`
	Scopes      []string `json:"scopes"`
	ExpiresAt   int64    `json:"expires_at,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// CreateAPIKey handles POST /api/v1/api-keys
func (h *APIHandler) CreateAPIKey(c *gin.Context) {
	var req CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: err.Error(),
		})
		return
	}

	var expiresAt time.Time
	if req.ExpiresAt > 0 {
		expiresAt = time.Unix(req.ExpiresAt, 0)
	}

	apiKey, err := h.configService.CreateAPIKey(c.Request.Context(), req.ServiceName, req.Description, req.Scopes, expiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "creation_failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":         apiKey.ID,
		"api_key":    apiKey.Key,
		"created_at": apiKey.CreatedAt.Unix(),
	})
}

// GetAPIKey handles GET /api/v1/api-keys/:id
func (h *APIHandler) GetAPIKey(c *gin.Context) {
	keyID := c.Param("id")
	if keyID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "key ID is required",
		})
		return
	}

	apiKey, err := h.configService.GetAPIKey(c.Request.Context(), keyID)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "not_found",
			Message: err.Error(),
		})
		return
	}

	// Don't include the actual key in the response
	response := gin.H{
		"id":           apiKey.ID,
		"service_name": apiKey.ServiceName,
		"description":  apiKey.Description,
		"scopes":       apiKey.Scopes,
		"created_at":   apiKey.CreatedAt.Unix(),
		"is_active":    apiKey.IsActive,
	}

	if !apiKey.ExpiresAt.IsZero() {
		response["expires_at"] = apiKey.ExpiresAt.Unix()
	}
	if !apiKey.LastUsedAt.IsZero() {
		response["last_used_at"] = apiKey.LastUsedAt.Unix()
	}

	c.JSON(http.StatusOK, response)
}

// UpdateAPIKey handles PUT /api/v1/api-keys/:id
func (h *APIHandler) UpdateAPIKey(c *gin.Context) {
	keyID := c.Param("id")
	if keyID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "key ID is required",
		})
		return
	}

	var req UpdateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: err.Error(),
		})
		return
	}

	var expiresAt time.Time
	if req.ExpiresAt > 0 {
		expiresAt = time.Unix(req.ExpiresAt, 0)
	}

	apiKey, err := h.configService.UpdateAPIKey(c.Request.Context(), keyID, req.Description, req.Scopes, expiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "update_failed",
			Message: err.Error(),
		})
		return
	}

	response := gin.H{
		"id":           apiKey.ID,
		"service_name": apiKey.ServiceName,
		"description":  apiKey.Description,
		"scopes":       apiKey.Scopes,
		"created_at":   apiKey.CreatedAt.Unix(),
		"is_active":    apiKey.IsActive,
	}

	if !apiKey.ExpiresAt.IsZero() {
		response["expires_at"] = apiKey.ExpiresAt.Unix()
	}
	if !apiKey.LastUsedAt.IsZero() {
		response["last_used_at"] = apiKey.LastUsedAt.Unix()
	}

	c.JSON(http.StatusOK, response)
}

// DeleteAPIKey handles DELETE /api/v1/api-keys/:id
func (h *APIHandler) DeleteAPIKey(c *gin.Context) {
	keyID := c.Param("id")
	if keyID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "key ID is required",
		})
		return
	}

	err := h.configService.DeleteAPIKey(c.Request.Context(), keyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "deletion_failed",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
	})
}

// ListAPIKeys handles GET /api/v1/services/:service/api-keys
func (h *APIHandler) ListAPIKeys(c *gin.Context) {
	serviceName := c.Param("service")
	if serviceName == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "invalid_request",
			Message: "service name is required",
		})
		return
	}

	apiKeys, err := h.configService.ListAPIKeys(c.Request.Context(), serviceName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "list_failed",
			Message: err.Error(),
		})
		return
	}

	var response []gin.H
	for _, apiKey := range apiKeys {
		keyResponse := gin.H{
			"id":           apiKey.ID,
			"service_name": apiKey.ServiceName,
			"description":  apiKey.Description,
			"scopes":       apiKey.Scopes,
			"created_at":   apiKey.CreatedAt.Unix(),
			"is_active":    apiKey.IsActive,
		}

		if !apiKey.ExpiresAt.IsZero() {
			keyResponse["expires_at"] = apiKey.ExpiresAt.Unix()
		}
		if !apiKey.LastUsedAt.IsZero() {
			keyResponse["last_used_at"] = apiKey.LastUsedAt.Unix()
		}

		response = append(response, keyResponse)
	}

	c.JSON(http.StatusOK, gin.H{
		"keys": response,
	})
}

// Health handles GET /api/v1/health
func (h *APIHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"service":   "config-service",
	})
}