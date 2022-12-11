import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import getRawUser from '../../../common/getRawUser';
import sendSocketToUser from '../../../common/sendSocketToUser';

import HttpException from '../../../exception';

const sendToSocketUser = async (
  req: Request<
    {
      id: string;
    },
    unknown,
    unknown,
    { q: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    if (user.friends.findIndex((friend) => friend == id) == -1) {
      throw new HttpException(StatusCodes.FORBIDDEN, 'Is not friend');
    }
    sendSocketToUser(id, 'webrtc', {
      from: getRawUser(user),
      data: req.body,
    });
    res.status(StatusCodes.OK).json('Send successful');
  } catch (error) {
    next(error);
  }
};

export default {
  sendToSocketUser,
};
