FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# Expose the port your Express app uses
EXPOSE 3000

# Run the dev script defined in package.json
CMD ["npm", "run", "dev"]
