FROM node:24-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4173 \
    BACSHOP_DATA_DIR=/var/lib/bacshop/private \
    BACSHOP_PRODUCTS_FILE=/var/lib/bacshop/products.json \
    BACSHOP_UPLOADS_DIR=/var/lib/bacshop/uploads

WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node server.js index.html app.js styles.css ./
COPY --chown=node:node assets ./assets
COPY --chown=node:node data ./data

RUN mkdir -p /var/lib/bacshop/private /var/lib/bacshop/uploads \
    && cp /app/data/products.json /var/lib/bacshop/products.json \
    && chown -R node:node /var/lib/bacshop

VOLUME ["/var/lib/bacshop"]
EXPOSE 4173
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:4173/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
