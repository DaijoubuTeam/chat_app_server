#!/bin/sh

create_admin() {
  touch /create_admin.js

  echo "db = db.getSiblingDB('admin');" >> /create_admin.js
  echo "db.createUser({" >> /create_admin.js
  echo "  user: '$MONGO_INITDB_ROOT_USERNAME'," >> /create_admin.js
  echo "  pwd: '$MONGO_INITDB_ROOT_PASSWORD'," >> /create_admin.js
  echo "  roles: [{ role: 'root', db: 'admin' }]," >> create_admin.js
  echo "});" >> /create_admin.js
}

init() {
  until [ $(echo 'db.runCommand("ping").ok' | mongo localhost:27017/test --quiet) -eq 1 ]
  do
    sleep 1
  done
  mongo --eval "rs.initiate()" 

  create_admin

  mongo /create_admin.js

}


init &

openssl rand -base64 525 > /mongodb_keyfile
chmod 400 /mongodb_keyfile

mongod --replSet rs0 --bind_ip localhost,$HOSTNAME --auth --keyFile /mongodb_keyfile

