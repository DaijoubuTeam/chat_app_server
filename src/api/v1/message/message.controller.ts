import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import { MessageType } from '../../../models/message';
import messageService from './message.service';

const postSendMessage = async (
  req: Request<
    { chatRoomId: string },
    unknown,
    { message: string; type: MessageType }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatRoomId } = req.params;
    const { message, type } = req.body;
    const user = req.user;
    if (!user || !message || !chatRoomId) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'Bad request: Invalid user, messsage or chatRoom id'
      );
    }
    const messageDTO = await messageService.sendMessage(
      user._id,
      chatRoomId,
      message,
      type
    );
    res.status(StatusCodes.CREATED).json({ message: messageDTO });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (
  req: Request<
    { chatRoomId: string },
    unknown,
    unknown,
    { from: number; to: number }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to } = req.query;
    const { chatRoomId } = req.params;
    const user = req.user;
    if (!from || !to) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'from and to must provided'
      );
    }
    if (!user) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    const messages = await messageService.getChatRoomMessage(
      chatRoomId,
      user._id,
      from,
      to
    );
    res.status(StatusCodes.OK).json(messages);
  } catch (error) {
    next(error);
  }
};

const getMessagesById = async (
  req: Request<
    { messageId: string },
    unknown,
    unknown,
    { before?: number; after?: number }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    let { after, before } = req.query;
    const { messageId } = req.params;
    const user = req.user;
    before = before ?? 0;
    after = after ?? 0;
    if (!user) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    const messages = await messageService.getMessagesById(
      messageId,
      user._id,
      before,
      after
    );
    res.status(StatusCodes.OK).json(messages);
  } catch (error) {
    next(error);
  }
};

export default {
  postSendMessage,
  getMessages,
  getMessagesById,
};
