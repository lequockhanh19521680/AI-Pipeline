# Multi-stage build for API Gateway
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY services/api-gateway/package.json ./services/api-gateway/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM base AS development
RUN npm ci
COPY . .
WORKDIR /app/services/api-gateway
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
COPY . .
WORKDIR /app/packages/shared
RUN npm run build
WORKDIR /app/services/api-gateway
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app/services/api-gateway/dist ./dist
COPY --from=build /app/services/api-gateway/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]