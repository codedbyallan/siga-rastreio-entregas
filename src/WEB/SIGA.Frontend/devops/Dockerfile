# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY src/WEB/SIGA.Frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/WEB/SIGA.Frontend . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY src/WEB/SIGA.Frontend/devops/nginx.conf /etc/nginx/nginx.conf
COPY src/WEB/SIGA.Frontend/devops/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
