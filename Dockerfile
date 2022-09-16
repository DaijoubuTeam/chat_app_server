FROM node:16 AS builder

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm install

COPY . .

RUN npm run build
FROM node:16-alpine3.16

WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN npm install

COPY --from=builder /app/dist .

CMD ["node", "index.js"]

ENV PORT=8080
ENV HOST=localhost
ENV BASE_PATH=api/v1/

EXPOSE 8080