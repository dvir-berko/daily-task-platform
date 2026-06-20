FROM node:20-alpine
# Upgrade all Alpine packages to fix CVEs in curl, busybox, freetype
RUN apk upgrade --no-cache
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN mkdir -p /app/data
ENV DATA_DIR=/app/data
EXPOSE 3001
CMD ["node", "index.js"]