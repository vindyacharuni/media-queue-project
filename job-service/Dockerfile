# Start from official Node.js image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Expose port
EXPOSE 3000

# Start the service
CMD ["node", "index.js"]