import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import messageService from './message.service';

const postSendMessage = async (
  req: Request<{ chatRoomId: string }, unknown, { message: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatRoomId } = req.params;
    const { message } = req.body;
    const user = req.user;
    if (!user || !message || !chatRoomId) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'Bad request: Invalid user, messsage or chatRoom id'
      );
    }
    await messageService.sendMessage(user._id, chatRoomId, message);
    res.status(StatusCodes.CREATED).end();
  } catch (error) {
    next(error);
  }
};

export default {
  postSendMessage,
};
