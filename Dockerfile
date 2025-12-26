# Dockerfile for Acquisitions App
# Multi-stage build for optimized production image

# Stage 1: Base image with dependencies
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Stage 2: Development dependencies
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy application source
COPY . .

# Expose port
EXPOSE 3000

# Start development server with watch mode
CMD ["npm", "run", "dev"]

# Stage 3: Build stage (if you add build steps later)
FROM base AS build

# Install all dependencies
RUN npm ci

# Copy application source
COPY . .

# Stage 4: Production dependencies
FROM base AS production-deps

# Install only production dependencies
RUN npm ci --omit=dev

# Stage 5: Production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy production dependencies from production-deps stage
COPY --from=production-deps /app/node_modules ./node_modules

# Copy application source
COPY package*.json ./
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["npm", "start"]
