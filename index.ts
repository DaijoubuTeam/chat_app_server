import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import SwaggerUI from 'swagger-ui-express';
import swaggerDocument from './docs/swagger/index.json';
import mongoose from 'mongoose';
import * as admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';
import apiRouter from './src/api';
import errorMiddleware from './src/middleware/error';
import fs from 'fs';
import https from 'https';
import http from 'http';
import * as socketIO from 'socket.io';
import registerSocket from './src/socket/register.socket';
import unregisterSocket from './src/socket/unregister.socket';

dotenv.config();
const httpsPort = process.env.HTTPS_PORT;
const httpPort = process.env.HTTP_PORT;
const mongo_url = process.env.MONGODB_URL;
const HTTPS_KEY_FILE = process.env.HTTPS_KEY_FILE;
const HTTPS_CERT_FILE = process.env.HTTPS_CERT_FILE;

if (!HTTPS_KEY_FILE || !HTTPS_CERT_FILE) {
  console.log('Invalid enviroment variable');
  process.exit();
}

if (!mongo_url || !httpsPort || !httpPort) {
  console.log('Invalid enviroment variable');
  process.exit();
}

const key = fs.readFileSync(HTTPS_KEY_FILE, 'utf-8');
const cert = fs.readFileSync(HTTPS_CERT_FILE, 'utf-8');

const app: Express = express();
const httpsServer = https.createServer({ key, cert }, app);
const httpServer = http.createServer(app);
const io = new socketIO.Server();

// #region Express Middleware
app.use(cors());

app.use(express.json());

if (process.env.ENVIRONMENT === 'DEV') {
  app.get('/', (req, res) => {
    res.redirect('/api-docs');
  });

  // Set up emulator
}

app.use('/api-docs', SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));

app.use('/api', apiRouter);

// Handle error

app.use(errorMiddleware);

// #endregion

// #region socket.IO
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    unregisterSocket(socket.id).then(() => {
      socket.emit('register', 'Unregister successful');
    });
  });

  socket.on('register', (arg) => {
    console.log(arg);
    if (!arg || !arg.uid) {
      socket.emit('register', 'Register failed');
      socket.disconnect();
    } else {
      registerSocket(arg.uid, socket.id).then(() =>
        socket.emit('register', 'Register successful')
      );
    }
  });
});
// #endregion

// Start server

async function startApp(
  mongo_url: string,
  httpServer: http.Server,
  httpsServer: https.Server,
  httpPort: string,
  httpsPort: string,
  io: socketIO.Server
) {
  await mongoose.connect(mongo_url);
  console.log('CONNECT TO DATABASE SUCCESSFUL');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  httpServer.listen(httpPort);
  httpsServer.listen(httpsPort);
  io.listen(httpServer);
  console.log(`HTTPS SERVER LISTEN ON PORT ${httpsPort}`);
  console.log(`HTTP SERVER LISTEN ON PORT ${httpPort}`);
}

startApp(mongo_url, httpServer, httpsServer, httpPort, httpsPort, io);

export { io };
