import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../../exception';
import ChatRoom from '../../../../models/chat_room';

const isGroupAdmin = async (
  req: Request<{ chatRoomId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatRoomId = req.params.chatRoomId;
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Chat room not found');
    }
    if (
      chatRoom.admin.findIndex((admin) => admin.toString() === user._id) === -1
    ) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default isGroupAdmin;
