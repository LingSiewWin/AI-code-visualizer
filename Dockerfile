# Multi-stage Dockerfile for AI Code Visualizer

# ================================
# Base Node.js Image
# ================================
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl git

# ================================
# Dependencies Stage
# ================================
FROM base AS deps
# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force
RUN cd server && npm ci --only=production && npm cache clean --force

# ================================
# Development Dependencies
# ================================
FROM base AS dev-deps
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies including dev
RUN npm ci && npm cache clean --force
RUN cd server && npm ci && npm cache clean --force

# ================================
# Frontend Build Stage
# ================================
FROM dev-deps AS frontend-build
# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY *.config.js ./
COPY *.json ./

# Build the frontend
ENV NODE_ENV=production
RUN npm run build

# ================================
# Frontend Production
# ================================
FROM base AS frontend
# Install serve for production
RUN npm install -g serve

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist
COPY --from=frontend-build /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start command
CMD ["serve", "-s", "dist", "-l", "3000"]

# ================================
# Backend Production
# ================================
FROM deps AS backend
# Copy server source code
COPY server/ ./server/
COPY scripts/ ./scripts/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start command
CMD ["node", "server.js"]

# ================================
# Worker Service
# ================================
FROM deps AS worker
# Copy server source code
COPY server/ ./server/
COPY scripts/ ./scripts/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S worker -u 1001

# Set permissions
RUN chown -R worker:nodejs /app
USER worker

# Set working directory to server
WORKDIR /app/server

# Start worker process
CMD ["node", "workers/index.js"]

# ================================
# Development Environment
# ================================
FROM dev-deps AS development
# Copy all source files
COPY . .

# Install development tools
RUN npm install -g nodemon concurrently

# Create non-root user for development
RUN addgroup -g 1001 -S nodejs
RUN adduser -S developer -u 1001
RUN chown -R developer:nodejs /app

USER developer

# Expose ports for frontend and backend
EXPOSE 3000 5000

# Development command
CMD ["npm", "run", "dev"]

# ================================
# Testing Environment
# ================================
FROM dev-deps AS testing
# Copy source code
COPY . .

# Install testing dependencies
RUN npm install -g jest cypress

# Run tests
CMD ["npm", "run", "test"]

# ================================
# Production Full Stack
# ================================
FROM nginx:alpine AS production
# Install Node.js for backend
RUN apk add --no-cache nodejs npm curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend to nginx
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy backend files
COPY --from=backend /app/server /app/server
COPY --from=deps /app/server/node_modules /app/server/node_modules

# Create startup script
RUN echo '#!/bin/sh' > /startup.sh && \
    echo 'cd /app/server && node server.js &' >> /startup.sh && \
    echo 'nginx -g "daemon off;"' >> /startup.sh && \
    chmod +x /startup.sh

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start both services
CMD ["/startup.sh"]

# ================================
# Docker Compose Override
# ================================
FROM base AS compose-frontend
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

FROM base AS compose-backend
COPY server/package*.json ./
RUN npm ci
COPY server/ .
EXPOSE 5000
CMD ["npm", "run", "dev"]