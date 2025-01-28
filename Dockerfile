FROM node:18-slim

WORKDIR /app

# Install required packages
RUN apt-get update && \
    apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Create session directory with full permissions
RUN mkdir -p session && \
    chmod -R 777 session

# Start the bot
CMD ["node", "index.js"]