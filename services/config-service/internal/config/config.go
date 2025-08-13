package config

import (
	"os"
	"strconv"
	"time"
)

// Config holds the application configuration
type Config struct {
	Server ServerConfig `json:"server"`
	Vault  VaultConfig  `json:"vault"`
	DB     DBConfig     `json:"db"`
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port         int           `json:"port"`
	GRPCPort     int           `json:"grpc_port"`
	ReadTimeout  time.Duration `json:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout"`
}

// VaultConfig holds Vault-related configuration
type VaultConfig struct {
	Address   string `json:"address"`
	Token     string `json:"token"`
	MountPath string `json:"mount_path"`
}

// DBConfig holds database-related configuration
type DBConfig struct {
	Type     string `json:"type"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			Port:         getEnvAsInt("SERVER_PORT", 8080),
			GRPCPort:     getEnvAsInt("GRPC_PORT", 9090),
			ReadTimeout:  time.Duration(getEnvAsInt("READ_TIMEOUT", 30)) * time.Second,
			WriteTimeout: time.Duration(getEnvAsInt("WRITE_TIMEOUT", 30)) * time.Second,
		},
		Vault: VaultConfig{
			Address:   getEnv("VAULT_ADDR", "http://localhost:8200"),
			Token:     getEnv("VAULT_TOKEN", ""),
			MountPath: getEnv("VAULT_MOUNT_PATH", "kv"),
		},
		DB: DBConfig{
			Type:     getEnv("DB_TYPE", "postgres"),
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			Name:     getEnv("DB_NAME", "ai_pipeline"),
			Username: getEnv("DB_USERNAME", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
		},
	}
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as integer with a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}