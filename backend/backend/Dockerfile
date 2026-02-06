FROM node:22-alpine

WORKDIR /app

# Copy package files (including package-lock.json)
COPY package.json package-lock.json* ./

# Install dependencies
# Use npm install if package-lock.json doesn't exist, otherwise use npm ci
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --production; fi

# Copy application files
COPY . .

# Expose port
EXPOSE 4003

# Set environment
ENV NODE_ENV=production
ENV PORT=4003

# Start the application
CMD ["node", "api/index.js"]

