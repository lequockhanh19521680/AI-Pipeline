# AI Pipeline - Microservices Development Guide

## Architecture Overview

This project has been restructured from a monolithic architecture to microservices and micro-frontends:

### Backend Microservices
- **API Gateway** (Port 3000) - Single entry point, routing, authentication middleware
- **Authentication Service** (Port 3001) - User management, OAuth 2.0, JWT tokens
- **Project Service** (Port 3002) - Project CRUD, metadata management 
- **GitHub Service** (Port 3003) - GitHub API proxy, repository operations
- **Pipeline Service** (Port 3004) - ML pipeline execution, real-time updates

### Frontend Micro-frontends
- **Shell Application** (Port 5173) - Main layout, Module Federation host
- **Authentication MF** (Port 3101) - Login, register, profile pages
- **Project MF** (Port 3102) - Project dashboard, creation, management
- **Workspace MF** (Port 3103) - IDE interface, file tree, editor

### Shared Packages
- **@ai-pipeline/shared** - Common types, interfaces, utilities

## Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (can use Docker)
- Redis (can use Docker)

### Quick Start

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd AI-Pipeline
npm install
```

2. **Start databases (Docker):**
```bash
npm run docker:dev
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Development mode (Traditional Monolith):**
```bash
npm run dev
```

5. **Development mode (Microservices):**
```bash
npm run dev:micro
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/ai-pipeline?authSource=admin

# JWT & Sessions
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# OAuth (GitHub)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Services URLs
AUTH_SERVICE_URL=http://localhost:3001
PROJECT_SERVICE_URL=http://localhost:3002
GITHUB_SERVICE_URL=http://localhost:3003
PIPELINE_SERVICE_URL=http://localhost:3004
```

## Development Workflows

### Working with Microservices

1. **Build shared package first:**
```bash
npm run build:shared
```

2. **Start individual services:**
```bash
# API Gateway
npm run dev -w @ai-pipeline/api-gateway

# Authentication Service
npm run dev -w @ai-pipeline/auth-service
```

3. **Start all services:**
```bash
npm run dev:services
```

### Testing

```bash
# Run all tests
npm test

# Test specific service
npm run test -w services/auth-service

# Frontend tests
npm run test --workspace=frontend
```

### Building

```bash
# Build everything
npm run build

# Build specific parts
npm run build:shared
npm run build:services
npm run build:frontend
```

## Docker Development

### Start infrastructure only:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Full microservices stack:
```bash
docker-compose up -d
```

### Build and run:
```bash
npm run docker:build
npm run docker:up
```

## API Documentation

### API Gateway (Port 3000)
- All requests go through the gateway
- Authentication handled automatically
- Routes:
  - `/api/auth/*` → Authentication Service
  - `/api/projects/*` → Project Service
  - `/api/github/*` → GitHub Service
  - `/api/pipeline/*` → Pipeline Service

### Authentication Service (Port 3001)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/verify` - Token verification

## File Structure

```
AI-Pipeline/
├── packages/
│   └── shared/                    # Shared types and utilities
├── services/
│   ├── api-gateway/              # API Gateway service
│   ├── auth-service/             # Authentication service
│   ├── project-service/          # Project management service
│   ├── github-service/           # GitHub integration service
│   └── pipeline-service/         # Pipeline execution service
├── frontend/
│   ├── shell/                    # Main shell application
│   ├── auth-mf/                  # Authentication micro-frontend
│   ├── project-mf/               # Project micro-frontend
│   └── workspace-mf/             # Workspace micro-frontend
├── backend/                      # Legacy monolith (being phased out)
├── shared/                       # Legacy shared files
├── docker-compose.yml            # Full microservices setup
├── docker-compose.dev.yml        # Development infrastructure
└── .github/workflows/            # CI/CD pipelines
```

## Migration Progress

### ✅ Completed
- Infrastructure setup (Docker, CI/CD)
- Shared package creation
- API Gateway implementation
- Authentication Service extraction
- Basic microservices communication

### 🔄 In Progress
- Project Service extraction
- GitHub Service extraction
- Pipeline Service refactoring

### 📋 Planned
- Frontend micro-frontends with Module Federation
- RBAC system implementation
- Real-time collaboration features
- Monitoring and logging setup
- Performance optimization

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Check which services are running: `npm run docker:down`
   - Use different ports in `.env` if needed

2. **Database connection issues:**
   - Ensure MongoDB is running: `docker ps`
   - Check connection string in `.env`

3. **Service communication failures:**
   - Verify all services are running
   - Check service URLs in environment variables
   - Review API Gateway logs

4. **Build failures:**
   - Clean and rebuild: `npm run clean && npm install && npm run build`
   - Build shared package first: `npm run build:shared`

### Debugging

- Service logs: `docker-compose logs <service-name>`
- Individual service debugging: Run with `DEBUG=*` environment variable
- Frontend debugging: Browser dev tools, React Dev Tools

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure all services build and tests pass

For detailed API documentation, see the individual service README files.