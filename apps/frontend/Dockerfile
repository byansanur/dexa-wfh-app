# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies (only for frontend and its dependencies)
RUN pnpm install --filter frontend... --frozen-lockfile

# Copy source code
COPY apps/frontend ./apps/frontend

# Build frontend static files (assumes VITE_API_URL=/api is configured)
RUN cd apps/frontend && pnpm run build

# Production Stage (Nginx)
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy custom Nginx proxy configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
