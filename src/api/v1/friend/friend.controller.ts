import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
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
    const userFriendsList = await servive.getFriendList(user.uid);
    res.status(StatusCodes.OK).json(userFriendsList);
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
    await servive.addFriendRequestList(user.uid, id);
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
    await servive.removeFriend(user.uid, id);
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
      await servive.acceptRequest(user.uid, id);
    } else if (action == 'denied') {
      await servive.deniedRequest(user.uid, id);
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json('invalid action');
    }
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

export default {
  getUserFriends,
  sendFriendRequest,
  deleteFriend,
  acceptOrDeniedFriendRequest,
};
