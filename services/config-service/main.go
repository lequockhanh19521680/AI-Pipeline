package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/config"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/grpc"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/handler"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/service"
	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/vault"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Vault client
	vaultClient, err := vault.NewClient(&cfg.Vault)
	if err != nil {
		log.Fatalf("Failed to create vault client: %v", err)
	}

	// Initialize services
	configService := service.NewConfigService(vaultClient)

	// Start gRPC server in a goroutine
	go func() {
		grpcServer := grpc.NewServer(configService)
		log.Printf("Starting gRPC server on port %d", cfg.Server.GRPCPort)
		if err := grpcServer.Start(strconv.Itoa(cfg.Server.GRPCPort)); err != nil {
			log.Fatalf("Failed to start gRPC server: %v", err)
		}
	}()

	// Initialize HTTP handlers
	r := gin.Default()
	
	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Setup API routes
	apiHandler := handler.NewAPIHandler(configService)
	apiHandler.SetupRoutes(r)

	// Start HTTP server
	log.Printf("Starting HTTP server on port %d", cfg.Server.Port)
	if err := http.ListenAndServe(":"+strconv.Itoa(cfg.Server.Port), r); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}