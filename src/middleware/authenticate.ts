import { Request, Response, NextFunction } from 'express';
import { AuthException } from '../exception/auth_exception';
import { StatusCodes } from 'http-status-codes';
import * as admin from 'firebase-admin';
import User from '../models/user';
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.split(' ')[1]) {
      throw new AuthException(
        StatusCodes.BAD_REQUEST,
        'No bearer token provided'
      );
    }

    const token = authorizationHeader.split(' ')[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    const uid = decodedToken.uid;

    const user = await User.findOne({ uid });
    if (!user) {
      throw new AuthException(StatusCodes.NOT_FOUND, 'User not found');
    }

    req.user = user;
  } catch (error) {
    next(error);
  }
};
export default authenticate;
