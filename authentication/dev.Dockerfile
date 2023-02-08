FROM node:18.14-alpine

WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm i

COPY . .

CMD ["pnpm","dev"]