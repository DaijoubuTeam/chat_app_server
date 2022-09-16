import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import SwaggerUI from 'swagger-ui-express';
import swaggerDocument from './docs/swagger/index.json';
import mongoose from 'mongoose';

dotenv.config();
const port = process.env.PORT;
const mongo_url = process.env.MONGODB_URL;

const app: Express = express();

// Middleware
app.use(cors());

app.use('/api-docs', SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));

// Start server
if (!mongo_url || !port) {
  console.log('Invalid enviroment variable');
  process.exit();
}
mongoose
  .connect(mongo_url)
  .then(() => {
    console.log('CONNECT TO DATABASE SUCCESSFUL');
    return app.listen(port);
  })
  .then(() => console.log(`LISTEN ON PORT ${port}`));
