# Multi-stage build for Authentication Service
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY services/auth-service/package.json ./services/auth-service/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM base AS development
RUN npm ci
COPY . .
WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
COPY . .
WORKDIR /app/packages/shared
RUN npm run build
WORKDIR /app/services/auth-service
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app/services/auth-service/dist ./dist
COPY --from=build /app/services/auth-service/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/server.js"]