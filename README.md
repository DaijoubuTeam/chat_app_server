# chat_app_server

## env_file required

- .env
- docker.env
- sendgrid.env

## docker build command

`docker buildx build --platform linux/arm64/v8 -t chat_app_server .`

## create network

`docker network create chat_app_server_network`

## delete network

`docker network rm chat_app_server_network`

## docker run command

### mongodb

`docker run --network chat_app_server_network -p 27017:27017 --name db-mongo -d mongo mongod --replSet chat-app-mongo-set`

### chat-app-server

`docker run --env-file docker.env --network chat_app_server_network -d -p 8080:8080 --name chat_app_server chat_app_server `

## docker stop command

### mongodb

`docker stop db-mongo`
`docker rm db-mongo`

### chat-app-server

`docker stop chat_app_server`

### Typesense

`docker run -d -p 8108:8108 -v ${PWD}/data/typesense-data:/data typesense/typesense:0.23.1 --data-dir /data --api-key=type-sense-api-key`

```
typesense-mongodb \
    --mongo-collection=users \
    --mongo-database=test \
    --typesense-collection=users \
    --mongo-url=mongodb://localhost:27017 \
    --typesense-url=http://localhost:8108 \
    --typesense-api-key=type-sense-api-key
```
