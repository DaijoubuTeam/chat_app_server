FROM node:18.14-alpine

WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm i

COPY . .

RUN pnpm build

ENV PORT=8080

EXPOSE 8080

CMD ["pnpm","start"]