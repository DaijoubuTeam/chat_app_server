import { Request, Response, NextFunction } from 'express';
import HttpException from '../../../exception';
import { StatusCodes } from 'http-status-codes';
import { getRawUser } from '../../../models/user';
import userService from './user.service';
import { IUser } from '../../../models/user';

const getSelfProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    res.status(StatusCodes.OK).json({ user: getRawUser(user) });
  } catch (error) {
    next(error);
  }
};

const putSelfProfile = async (
  req: Request<any, any, IUser>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const userInfo = req.body;
    const updatedUser = await userService.updateUserProfile(user.uid, userInfo);
    res.status(StatusCodes.OK).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    if (user.isEmailVerified) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'Email address has already been verified'
      );
    }
    await userService.sendVerifyEmailMail(user.email);
    res.status(StatusCodes.OK).json('Email is sent');
  } catch (error) {
    next(error);
  }
};

export default { getSelfProfile, putSelfProfile, verifyEmail };
