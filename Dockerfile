# Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY config ./config/

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/config ./config/

EXPOSE 3001

CMD ["node", "dist/main"]