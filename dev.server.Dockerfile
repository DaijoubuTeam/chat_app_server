FROM node:alpine

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm i

COPY . .

EXPOSE 80
EXPOSE 443

CMD [ "npm", "run", "dev" ]