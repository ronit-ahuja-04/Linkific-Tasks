# Intern Quest as a container: the self-hosting alternative to Vercel (any VPS, Fly.io, Railway, Render...).
#   docker build -t intern-quest --build-arg NEXT_PUBLIC_SITE_URL=https://your.domain .
#   docker run -p 3000:3000 --env-file .env.production intern-quest
# Three stages, so the final image holds only the built server and its runtime files: no source, no dev tools.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_ values are baked into the browser JavaScript at build time, so they are build arguments.
# Server secrets are NOT: they are given to `docker run` and never end up in an image layer.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL BUILD_STANDALONE=1 NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/robots.txt > /dev/null || exit 1
CMD ["node", "server.js"]
