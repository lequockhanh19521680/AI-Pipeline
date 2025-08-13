package grpc

import (
	"context"
	"net"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/lequockhanh19521680/AI-Pipeline/services/config-service/internal/service"
	pb "github.com/lequockhanh19521680/AI-Pipeline/services/config-service/proto"
)

// Server implements the gRPC ConfigService
type Server struct {
	pb.UnimplementedConfigServiceServer
	configService *service.ConfigService
}

// NewServer creates a new gRPC server
func NewServer(configService *service.ConfigService) *Server {
	return &Server{
		configService: configService,
	}
}

// Start starts the gRPC server on the specified port
func (s *Server) Start(port string) error {
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		return err
	}

	grpcServer := grpc.NewServer()
	pb.RegisterConfigServiceServer(grpcServer, s)

	return grpcServer.Serve(lis)
}

// CreateAPIKey implements the CreateAPIKey RPC
func (s *Server) CreateAPIKey(ctx context.Context, req *pb.CreateAPIKeyRequest) (*pb.CreateAPIKeyResponse, error) {
	if req.ServiceName == "" {
		return nil, status.Error(codes.InvalidArgument, "service_name is required")
	}

	var expiresAt time.Time
	if req.ExpiresAt > 0 {
		expiresAt = time.Unix(req.ExpiresAt, 0)
	}

	apiKey, err := s.configService.CreateAPIKey(ctx, req.ServiceName, req.Description, req.Scopes, expiresAt)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.CreateAPIKeyResponse{
		KeyId:     apiKey.ID,
		ApiKey:    apiKey.Key,
		CreatedAt: apiKey.CreatedAt.Unix(),
	}, nil
}

// GetAPIKey implements the GetAPIKey RPC
func (s *Server) GetAPIKey(ctx context.Context, req *pb.GetAPIKeyRequest) (*pb.GetAPIKeyResponse, error) {
	if req.KeyId == "" {
		return nil, status.Error(codes.InvalidArgument, "key_id is required")
	}

	apiKey, err := s.configService.GetAPIKey(ctx, req.KeyId)
	if err != nil {
		return nil, status.Error(codes.NotFound, err.Error())
	}

	metadata := &pb.APIKeyMetadata{
		KeyId:       apiKey.ID,
		ServiceName: apiKey.ServiceName,
		Description: apiKey.Description,
		Scopes:      apiKey.Scopes,
		CreatedAt:   apiKey.CreatedAt.Unix(),
		IsActive:    apiKey.IsActive,
	}

	if !apiKey.ExpiresAt.IsZero() {
		metadata.ExpiresAt = apiKey.ExpiresAt.Unix()
	}
	if !apiKey.LastUsedAt.IsZero() {
		metadata.LastUsedAt = apiKey.LastUsedAt.Unix()
	}

	return &pb.GetAPIKeyResponse{
		Metadata: metadata,
	}, nil
}

// UpdateAPIKey implements the UpdateAPIKey RPC
func (s *Server) UpdateAPIKey(ctx context.Context, req *pb.UpdateAPIKeyRequest) (*pb.UpdateAPIKeyResponse, error) {
	if req.KeyId == "" {
		return nil, status.Error(codes.InvalidArgument, "key_id is required")
	}

	var expiresAt time.Time
	if req.ExpiresAt > 0 {
		expiresAt = time.Unix(req.ExpiresAt, 0)
	}

	apiKey, err := s.configService.UpdateAPIKey(ctx, req.KeyId, req.Description, req.Scopes, expiresAt)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	metadata := &pb.APIKeyMetadata{
		KeyId:       apiKey.ID,
		ServiceName: apiKey.ServiceName,
		Description: apiKey.Description,
		Scopes:      apiKey.Scopes,
		CreatedAt:   apiKey.CreatedAt.Unix(),
		IsActive:    apiKey.IsActive,
	}

	if !apiKey.ExpiresAt.IsZero() {
		metadata.ExpiresAt = apiKey.ExpiresAt.Unix()
	}
	if !apiKey.LastUsedAt.IsZero() {
		metadata.LastUsedAt = apiKey.LastUsedAt.Unix()
	}

	return &pb.UpdateAPIKeyResponse{
		Metadata: metadata,
	}, nil
}

// DeleteAPIKey implements the DeleteAPIKey RPC
func (s *Server) DeleteAPIKey(ctx context.Context, req *pb.DeleteAPIKeyRequest) (*pb.DeleteAPIKeyResponse, error) {
	if req.KeyId == "" {
		return nil, status.Error(codes.InvalidArgument, "key_id is required")
	}

	err := s.configService.DeleteAPIKey(ctx, req.KeyId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.DeleteAPIKeyResponse{
		Success: true,
	}, nil
}

// ListAPIKeys implements the ListAPIKeys RPC
func (s *Server) ListAPIKeys(ctx context.Context, req *pb.ListAPIKeysRequest) (*pb.ListAPIKeysResponse, error) {
	if req.ServiceName == "" {
		return nil, status.Error(codes.InvalidArgument, "service_name is required")
	}

	apiKeys, err := s.configService.ListAPIKeys(ctx, req.ServiceName)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var metadata []*pb.APIKeyMetadata
	for _, apiKey := range apiKeys {
		meta := &pb.APIKeyMetadata{
			KeyId:       apiKey.ID,
			ServiceName: apiKey.ServiceName,
			Description: apiKey.Description,
			Scopes:      apiKey.Scopes,
			CreatedAt:   apiKey.CreatedAt.Unix(),
			IsActive:    apiKey.IsActive,
		}

		if !apiKey.ExpiresAt.IsZero() {
			meta.ExpiresAt = apiKey.ExpiresAt.Unix()
		}
		if !apiKey.LastUsedAt.IsZero() {
			meta.LastUsedAt = apiKey.LastUsedAt.Unix()
		}

		metadata = append(metadata, meta)
	}

	return &pb.ListAPIKeysResponse{
		Keys: metadata,
	}, nil
}