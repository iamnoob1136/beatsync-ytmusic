# Stage 1: production dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN bun install --production --ignore-scripts

# Stage 2: bundle the server
FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app /app
COPY apps/server/src ./apps/server/src
COPY apps/server/tsconfig.json ./apps/server/tsconfig.json
COPY packages/shared ./packages/shared
WORKDIR /app/apps/server
RUN bun run build

# Stage 3: production image
FROM oven/bun:1-slim AS runner
WORKDIR /app/apps/server
COPY --from=build /app/apps/server/dist ./dist

EXPOSE 10000
ENV NODE_ENV=production

CMD ["bun", "dist/index.js"]
