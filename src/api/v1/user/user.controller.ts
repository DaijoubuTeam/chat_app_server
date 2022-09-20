import { Request, Response, NextFunction } from 'express';
import HttpException from '../../../exception';
import { StatusCodes } from 'http-status-codes';
import { getRawUser, IUser } from '../../../models/user';
import { UserAuthInfoRequest } from '../../../types/express/user_auth_info_request';

const getSelfProfile = async (
  req: UserAuthInfoRequest,
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

export default { getSelfProfile };
