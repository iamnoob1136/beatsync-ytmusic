FROM oven/bun:1 AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/freeman-jiang/beatsync.git /tmp/upstream

COPY .beatsync-ytmusic/apps/server/src/managers/MusicProviderManager.ts /tmp/overlay/src/managers/MusicProviderManager.ts
COPY .beatsync-ytmusic/apps/server/src/websocket/handlers/handleStreamMusic.ts /tmp/overlay/src/websocket/handlers/handleStreamMusic.ts
COPY .beatsync-ytmusic/apps/server/src/routes/youtubeStream.ts /tmp/overlay/src/routes/youtubeStream.ts
COPY .beatsync-ytmusic/apps/server/src/index.ts /tmp/overlay/src/index.ts
COPY .beatsync-ytmusic/apps/server/package.json /tmp/overlay/package.json

RUN cp -a /tmp/upstream/. /app/ && \
    cp /tmp/overlay/package.json /app/apps/server/package.json && \
    cp /tmp/overlay/src/managers/MusicProviderManager.ts /app/apps/server/src/managers/MusicProviderManager.ts && \
    cp /tmp/overlay/src/websocket/handlers/handleStreamMusic.ts /app/apps/server/src/websocket/handlers/handleStreamMusic.ts && \
    cp /tmp/overlay/src/routes/youtubeStream.ts /app/apps/server/src/routes/youtubeStream.ts && \
    cp /tmp/overlay/src/index.ts /app/apps/server/src/index.ts

RUN bun install
RUN bun run --cwd apps/server build

FROM oven/bun:1-slim AS runner
WORKDIR /app/apps/server
COPY --from=build /app/apps/server/dist ./dist
ENV NODE_ENV=production
EXPOSE 10000
CMD ["bun", "dist/index.js"]
