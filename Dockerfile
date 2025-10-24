# Dockerfile

# ---------- BUILD STAGE ----------
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Only copy package files to install deps
COPY package*.json ./

# Install all deps (including dev if needed)
RUN npm ci

# Copy all source files
COPY . .

# ---------- RUNTIME STAGE ----------
FROM node:18-alpine

WORKDIR /usr/src/app

# Install tini for better signal handling (optional but recommended)
RUN apk add --no-cache tini

# Copy node_modules and built app from builder stage
COPY --from=builder /usr/src/app /usr/src/app

# Set environment variable for production
# ENV NODE_ENV=production

# Expose your app port
EXPOSE 4001

# Use tini as init system to handle SIGINT/SIGTERM properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start app
CMD ["node", "bin/www"]
