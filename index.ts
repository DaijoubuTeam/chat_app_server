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

dotenv.config();
const port = process.env.PORT;
const mongo_url = process.env.MONGODB_URL;

const app: Express = express();

// Middleware
app.use(cors());

app.use(express.json());

app.use('/api-docs', SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));

app.use('/api', apiRouter);

// Handle error

app.use(errorMiddleware);

// Start server
if (!mongo_url || !port) {
  console.log('Invalid enviroment variable');
  process.exit();
}

const key = fs.readFileSync('localhost-key.pem', 'utf-8');
const cert = fs.readFileSync('localhost.pem', 'utf-8');

async function startApp(
  mongo_url: string,
  app: express.Express,
  port: string,
  key: string,
  cert: string
) {
  await mongoose.connect(mongo_url);
  console.log('CONNECT TO DATABASE SUCCESSFUL');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  https.createServer({ key, cert }, app).listen(port);
  console.log(`LISTEN ON PORT ${port}`);
}

startApp(mongo_url, app, port, key, cert);
