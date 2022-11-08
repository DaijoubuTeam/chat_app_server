#!/bin/sh

touch createAdmin.js

echo "db = db.getSiblingDB('admin');" >> createAdmin.js
echo "db.createUser({" >> createAdmin.js
echo "  user: 'root'," >> createAdmin.js
echo "  pwd: 'example'," >> createAdmin.js
echo "  roles: [{ role: 'root', db: 'admin' }]," >> createAdmin.js
echo "});" >> createAdmin.js

