FROM node:alpine

RUN apk add openjdk11

RUN npm install -g firebase-tools

WORKDIR /app

COPY .firebaserc firebase.json storage.rules ./

CMD [ "firebase", "emulators:start" ]