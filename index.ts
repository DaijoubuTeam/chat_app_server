import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import SwaggerUI from 'swagger-ui-express';
import swaggerDocument from './docs/swagger/index.json';

dotenv.config();
const port = process.env.PORT;

const app: Express = express();

// Middleware
app.use(cors());

app.use('/api-docs', SwaggerUI.serve, SwaggerUI.setup(swaggerDocument));

// Start server
app.listen(port, () => {
  console.log(`LISTEN ON PORT ${port}`);
});
