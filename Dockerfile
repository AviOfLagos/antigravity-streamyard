FROM node:22-alpine

WORKDIR /app

# Install openssl for Prisma binary compatibility on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client (schema must exist before build)
RUN npx prisma generate

# Build Next.js directly — skip `prisma migrate deploy` (that runs at startup
# via docker-entrypoint.sh, not at build time, because no DB is available yet).
RUN npx next build

EXPOSE 3000

# docker-entrypoint.sh was already copied by `COPY . .` above.
# Make it executable and put it on PATH.
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
