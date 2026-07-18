# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (only for backend and its dependencies)
RUN pnpm install --filter backend... --frozen-lockfile

# Copy source code and Prisma schema
COPY apps/backend ./apps/backend

# Generate Prisma Client & Build
RUN cd apps/backend && npx prisma generate && pnpm run build

# Production Stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm

# Copy production configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN pnpm install --filter backend... --prod --frozen-lockfile --ignore-scripts

# Copy build artifacts and generated Prisma client
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/node_modules/@prisma/client ./apps/backend/node_modules/@prisma/client
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY apps/backend/prisma ./apps/backend/prisma

EXPOSE 3000
WORKDIR /app/apps/backend

# Use non-root node user for security hardening
USER node

ENV NODE_ENV=production

CMD ["node", "dist/main"]
