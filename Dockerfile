# Build stage for React app
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy server files
COPY server/ ./server/
COPY package*.json ./

# Install server dependencies only
RUN npm ci --only=production

# Copy built React app from builder
COPY --from=client-builder /app/client/build ./client/build

# Expose port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Start server
CMD ["node", "server/index.js"]

