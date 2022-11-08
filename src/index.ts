import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import SwaggerUI from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger/index.json';
import mongoose from 'mongoose';
import * as admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json';
import apiRouter from './api';
import errorMiddleware from './middleware/error';
import http from 'http';
import * as socketIO from 'socket.io';
import registerSocket from './socket/register.socket';
import unregisterSocket from './socket/unregister.socket';

dotenv.config();
const httpPort = process.env.HTTP_PORT;
const mongo_url = process.env.MONGODB_URL;

if (!mongo_url || !httpPort) {
  console.log('Invalid enviroment variable');
  process.exit();
}

const app: Express = express();
const httpServer = http.createServer(app);
const io = new socketIO.Server();

// #region Express Middleware
app.use(cors());

app.use(express.json());

if (process.env.ENVIRONMENT === 'DEV') {
  app.get('/', (req, res) => {
    res.redirect('/api-docs');
  });
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
    } else {
      registerSocket(arg.uid, socket.id)
        .then(() => socket.emit('register', 'Register successful'))
        .catch((err) => {
          socket.emit('register', `Register failed: ${err}`);
        });
    }
  });
});
// #endregion

// Start server

async function startApp(
  mongo_url: string,
  httpServer: http.Server,
  httpPort: string,
  io: socketIO.Server
) {
  await mongoose.connect(mongo_url);
  console.log('CONNECT TO DATABASE SUCCESSFUL');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  httpServer.listen(httpPort);
  io.listen(httpServer);
  console.log(`HTTP SERVER LISTEN ON PORT ${httpPort}`);
}

startApp(mongo_url, httpServer, httpPort, io);

export { io };
