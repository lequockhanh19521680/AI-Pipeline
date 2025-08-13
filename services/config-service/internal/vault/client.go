package vault

import (
	"context"
	"fmt"
	"github.com/hashicorp/vault/api"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/config"
)

// Client wraps the Vault API client and implements the VaultClient interface
type Client struct {
	client    *api.Client
	mountPath string
}

// NewClient creates a new Vault client
func NewClient(cfg *config.VaultConfig) (*Client, error) {
	vaultConfig := api.DefaultConfig()
	vaultConfig.Address = cfg.Address

	client, err := api.NewClient(vaultConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create vault client: %w", err)
	}

	if cfg.Token != "" {
		client.SetToken(cfg.Token)
	}

	return &Client{
		client:    client,
		mountPath: cfg.MountPath,
	}, nil
}

// StoreSecret stores a secret in Vault
func (c *Client) StoreSecret(ctx context.Context, path string, data map[string]interface{}) error {
	secretPath := fmt.Sprintf("%s/data/%s", c.mountPath, path)
	
	secretData := map[string]interface{}{
		"data": data,
	}

	_, err := c.client.Logical().Write(secretPath, secretData)
	if err != nil {
		return fmt.Errorf("failed to store secret at path %s: %w", path, err)
	}

	return nil
}

// GetSecret retrieves a secret from Vault
func (c *Client) GetSecret(ctx context.Context, path string) (map[string]interface{}, error) {
	secretPath := fmt.Sprintf("%s/data/%s", c.mountPath, path)

	secret, err := c.client.Logical().Read(secretPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read secret at path %s: %w", path, err)
	}

	if secret == nil {
		return nil, fmt.Errorf("secret not found at path %s", path)
	}

	data, ok := secret.Data["data"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid secret format at path %s", path)
	}

	return data, nil
}

// DeleteSecret deletes a secret from Vault
func (c *Client) DeleteSecret(ctx context.Context, path string) error {
	secretPath := fmt.Sprintf("%s/data/%s", c.mountPath, path)

	_, err := c.client.Logical().Delete(secretPath)
	if err != nil {
		return fmt.Errorf("failed to delete secret at path %s: %w", path, err)
	}

	return nil
}

// ListSecrets lists secrets at a given path
func (c *Client) ListSecrets(ctx context.Context, path string) ([]string, error) {
	secretPath := fmt.Sprintf("%s/metadata/%s", c.mountPath, path)

	secret, err := c.client.Logical().List(secretPath)
	if err != nil {
		return nil, fmt.Errorf("failed to list secrets at path %s: %w", path, err)
	}

	if secret == nil || secret.Data == nil {
		return []string{}, nil
	}

	keys, ok := secret.Data["keys"].([]interface{})
	if !ok {
		return []string{}, nil
	}

	result := make([]string, len(keys))
	for i, key := range keys {
		if keyStr, ok := key.(string); ok {
			result[i] = keyStr
		}
	}

	return result, nil
}

// Health checks the health of the Vault connection
func (c *Client) Health(ctx context.Context) error {
	health, err := c.client.Sys().Health()
	if err != nil {
		return fmt.Errorf("vault health check failed: %w", err)
	}

	if !health.Initialized {
		return fmt.Errorf("vault is not initialized")
	}

	if health.Sealed {
		return fmt.Errorf("vault is sealed")
	}

	return nil
}