# Build context is the REPO ROOT (the lockfile lives there):
#   docker build -f apps/api/Dockerfile -t thumbnailer-api .
FROM oven/bun:1-slim

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies first so this layer is cached until package files change.
# bun.lock* matches either bun.lock or the older bun.lockb.
COPY package.json bun.lock* ./
COPY apps/api/package.json apps/api/package.json
RUN bun install --frozen-lockfile --production

COPY apps/api apps/api

WORKDIR /app/apps/api

# Run as the non-root user that ships with the bun image.
USER bun

EXPOSE 3000

# The slim image has no curl, so use bun itself for the check.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "src/index.ts"]