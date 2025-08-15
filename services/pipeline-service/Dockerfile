# Multi-stage build for Pipeline Service
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY services/pipeline-service/package.json ./services/pipeline-service/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM base AS development
RUN npm ci
COPY . .
WORKDIR /app/services/pipeline-service
EXPOSE 3004
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
COPY . .
WORKDIR /app/packages/shared
RUN npm run build
WORKDIR /app/services/pipeline-service
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app/services/pipeline-service/dist ./dist
COPY --from=build /app/services/pipeline-service/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3004
CMD ["node", "dist/server.js"]