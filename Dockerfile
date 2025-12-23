# ---- Build Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies separately to leverage Docker layer caching
COPY package.json package-lock.json ./
# Skip npm-force-resolutions, or handle it manually if needed
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy required production files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Optional: install only production dependencies (smaller image)
# RUN npm ci --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
