import { Request, Response, NextFunction } from 'express';
import HttpException from '../../../exception';
import { StatusCodes } from 'http-status-codes';
import getRawUser from '../../../common/getRawUser';
import userService from './user.service';
import { IUser } from '../../../models/user';
import dotenv from 'dotenv';
import validator from '../../../validator';
import path from 'path';

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
  req: Request<unknown, unknown, IUser>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const userInfo = req.body;
    const updatedUser = await userService.updateUserProfile(user._id, userInfo);
    res.status(StatusCodes.OK).json({ user: getRawUser(updatedUser) });
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
  res: Response
) => {
  const successTemplatePath = path.join(__dirname, 'template', 'success.html');
  const failureTemplatePath = path.join(__dirname, 'template', 'failure.html');

  try {
    const { token } = req.query;

    if (!token) {
      return res.sendFile(failureTemplatePath);
    }
    await userService.changeEmailVerified(token);

    res.status(StatusCodes.OK).sendFile(successTemplatePath);
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).sendFile(failureTemplatePath);
  }
};

const searchUser = async (
  req: Request<unknown, unknown, unknown, { search?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search } = req.query;
    const user = await userService.searchUser(search);
    const isFriend = await userService.isFriend(user._id, req.user?._id ?? '');
    const isSelf = user._id === req.user?._id;
    res.status(StatusCodes.OK).json({ ...getRawUser(user), isFriend, isSelf });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!validator.isId.isUserId(id)) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid id');
    }
    const user = await userService.getUserById(id);
    if (user === null || user === undefined) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    res.status(StatusCodes.OK).json(getRawUser(user));
  } catch (error) {
    next(error);
  }
};

export default {
  getSelfProfile,
  putSelfProfile,
  verifyEmail,
  changeMailVerified,
  searchUser,
  getUserById,
};
