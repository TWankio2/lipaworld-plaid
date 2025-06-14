FROM node:18-alpine

WORKDIR /opt/app

# Set proper ownership for the node user (already exists in node:alpine)
RUN chown -R node:node /opt/app

# Copy package files with proper ownership
COPY --chown=node:node package*.json ./

# Switch to node user before installing dependencies
USER node

# Install dependencies
RUN npm ci --only=production

# Copy source code and config files with proper ownership
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./tsconfig.json ./
COPY --chown=node:node ./healthcheck.js ./
COPY --chown=node:node ./.env ./

# Install dev dependencies for building
USER root
RUN npm install typescript @types/node --save-dev
USER node

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
ENTRYPOINT ["node"]
CMD ["dist/server.js"]