# Luma Party – Container für beliebige Hosting-Anbieter (Railway, Fly.io, eigener Server …)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev --ignore-scripts

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production LUMA_PUBLIC=1 PORT=3000 WORD_LISTS_FILE=/tmp/luma/word-lists.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./
EXPOSE 3000
USER node
CMD ["node_modules/.bin/tsx", "src/server/main.ts"]
