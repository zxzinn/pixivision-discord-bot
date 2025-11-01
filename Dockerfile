# Dockerfile for Pixivision Discord Bot
# Optimized for GCP Cloud Run deployment

FROM oven/bun:1.2-slim AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source code
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose port (optional, for health checks)
EXPOSE 8080

# Health check endpoint (optional)
# You can add a simple HTTP server for health checks if needed

# Run the bot
CMD ["bun", "run", "src/index.ts"]
