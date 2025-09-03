FROM node:20-slim AS deps
WORKDIR /usr/src/app
ARG GIT_TAG=latest
ENV CI=true
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-slim AS runner
ENV NODE_ENV=production TZ=UTC
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ca-certificates fonts-liberation wget \
      python3 \
      libgbm1 libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
      libexpat1 libfontconfig1 libgcc1 libgdk-pixbuf2.0-0 libglib2.0-0 \
      libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
      libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
      libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
      xdg-utils && \
    rm -rf /var/lib/apt/lists/*
    
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

EXPOSE 3113
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3113)+'/',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "app.js"]

ARG GIT_TAG=latest
LABEL git.tag=${GIT_TAG}
