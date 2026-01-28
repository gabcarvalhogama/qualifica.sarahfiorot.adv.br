# Etapa 1: build do Vite
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servidor Express para servir o frontend
FROM node:20-alpine

WORKDIR /app

# Copia os arquivos necessários da etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY package*.json ./

RUN npm install

# Configuração do container

EXPOSE 80
ENV PORT=80
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Inicia o servidor
CMD ["node", "server.js"]