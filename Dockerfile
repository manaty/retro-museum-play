FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY scripts ./scripts
RUN node scripts/build-zx80.js
COPY server.js catalog.js ./
USER node
ENV PORT=8080
CMD ["node","server.js"]
