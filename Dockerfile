# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY . .

# Expose port (Cloud Run uses PORT env var)
EXPOSE 5000

# Start server
CMD ["npm", "start"]
