import { Request, Response, NextFunction } from 'express';
import HttpException from '../../../exception';
import { StatusCodes } from 'http-status-codes';
import getRawUser from '../../../common/getRawUser';
import userService from './user.service';
import { IUser } from '../../../models/user';
import dotenv from 'dotenv';

dotenv.config();

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

const changeMailVerified = async (
  req: Request<any, any, any, { token: string }>,
  res: Response,
  next: NextFunction
) => {
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    return res.status(StatusCodes.NOT_FOUND).send('<h1>Not found</h1>');
  }
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(clientUrl);
    }
    await userService.changeEmailVerified(token);
    res.status(StatusCodes.OK).redirect(clientUrl);
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).redirect(clientUrl);
  }
};

export default {
  getSelfProfile,
  putSelfProfile,
  verifyEmail,
  changeMailVerified,
};
