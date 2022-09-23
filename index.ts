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

dotenv.config();
const httpsPort = process.env.HTTPS_PORT;
const httpPort = process.env.HTTP_PORT;
const mongo_url = process.env.MONGODB_URL;

const app: Express = express();

// Middleware
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

// Start server
if (!mongo_url || !httpsPort || !httpPort) {
  console.log('Invalid enviroment variable');
  process.exit();
}

const HTTPS_KEY_FILE = process.env.HTTPS_KEY_FILE;
const HTTPS_CERT_FILE = process.env.HTTPS_CERT_FILE;

const key = fs.readFileSync('localhost-key.pem', 'utf-8');
const cert = fs.readFileSync('localhost.pem', 'utf-8');

async function startApp(
  mongo_url: string,
  app: express.Express,
  httpPort: string,
  httpsPort: string,
  key: string,
  cert: string
) {
  await mongoose.connect(mongo_url);
  console.log('CONNECT TO DATABASE SUCCESSFUL');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  https.createServer({ key, cert }, app).listen(httpsPort);
  http.createServer(app).listen(httpPort);
  console.log(`HTTPS SERVER LISTEN ON PORT ${httpsPort}`);
  console.log(`HTTP SERVER LISTEN ON PORT ${httpPort}`);
}

startApp(mongo_url, app, httpPort, httpsPort, key, cert);
