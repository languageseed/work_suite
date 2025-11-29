FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "server.js"]

