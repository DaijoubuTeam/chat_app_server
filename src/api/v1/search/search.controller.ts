import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import searchService from './search.service';

const searchUser = async (
  req: Request<unknown, unknown, unknown, { q: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const userIds = await searchService.searchUsers(q, user.friends);
    const filteredUser = await searchService.filterUserFriend(userIds);
    res.status(StatusCodes.OK).json(filteredUser);
  } catch (error) {
    next(error);
  }
};

export default {
  searchUser,
};
