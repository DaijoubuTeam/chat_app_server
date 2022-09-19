import { Request, Response, NextFunction } from 'express';
import HttpException from '../exception';
import dotenv from 'dotenv';

dotenv.config();

const errorMiddleware = (
  err: HttpException,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (process.env.ENVIRONMENT === 'DEV') console.log(err);
  res.status(err.statusCode || 500).json({ message: err.message });
};

export default errorMiddleware;
