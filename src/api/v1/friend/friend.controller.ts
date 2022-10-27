import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import getRawUser from '../../../common/getRawUser';
import HttpException from '../../../exception';
import { IUser } from '../../../models/user';
import servive from './friend.service';

const getUserFriends = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const userFriendsList = await servive.getFriendList(user._id);
    res
      .status(StatusCodes.OK)
      .json(
        (userFriendsList as unknown as IUser[]).map((user) => getRawUser(user))
      );
  } catch (error) {
    next(error);
  }
};

const sendFriendRequest = async (
  req: Request<unknown, unknown, { id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { id } = req.body;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    if (!id) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'Friend id not found');
    }
    await servive.addFriendRequestList(user._id, id);
    res.status(StatusCodes.OK).end();
  } catch (error) {
    next(error);
  }
};

const deleteFriend = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    if (!id) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'Friend id not found');
    }
    await servive.removeFriend(user._id, id);
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

const acceptOrDeniedFriendRequest = async (
  req: Request<{ id: string }, unknown, unknown, { action: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { action } = req.query;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    if (!id) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'Friend id not found');
    }
    if (action == 'accept') {
      await servive.acceptRequest(user._id, id);
    } else if (action == 'denied') {
      await servive.deniedRequest(user._id, id);
    } else if (action === 'ban') {
      await servive.banUser(user._id, id);
    } else if (action === 'unban') {
      await servive.unbanUser(user._id, id);
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json('invalid action');
    }
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

const getFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const userFriendRequestsList = await servive.getFriendRequestList(user._id);
    res
      .status(StatusCodes.OK)
      .json(
        (userFriendRequestsList as unknown as IUser[]).map((user) =>
          getRawUser(user)
        )
      );
  } catch (error) {
    next(error);
  }
};

export default {
  getUserFriends,
  sendFriendRequest,
  deleteFriend,
  acceptOrDeniedFriendRequest,
  getFriendRequest,
};
