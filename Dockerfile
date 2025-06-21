# Build Stage
FROM node:20-slim AS builder
WORKDIR /app

# Add essential build tools
RUN apt-get update && apt-get install -y \
    python3 make g++ cmake zlib1g-dev git \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Runtime Stage
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app /app
RUN rm -rf node_modules/.cache .git && npm prune --omit=dev
CMD ["sh", "-c", "while true; do node start.js; sleep 14400; done"]
