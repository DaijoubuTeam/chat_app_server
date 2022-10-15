import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import chatroomService from './chatroom.service';
import HttpException from '../../../exception';
import getRawChatRoom from '../../../common/getRawChatRoom';

const getUserChatRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const chatRooms = await chatroomService.getUserChatRooms(user._id);
    res.status(StatusCodes.OK).json({
      chatRooms: chatRooms.map((chatRoom) => getRawChatRoom(chatRoom)),
    });
  } catch (error) {
    next(error);
  }
};

const postNewChatRoom = async (
  req: Request<unknown, unknown, { chatRoomName: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { chatRoomName } = req.body;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const chatRoom = await chatroomService.createNewChatRoom(
      chatRoomName,
      user._id
    );
    res.status(StatusCodes.CREATED).json(getRawChatRoom(chatRoom));
  } catch (error) {
    next(error);
  }
};

const putChatRoom = async (
  req: Request<
    { chatRoomId: string },
    unknown,
    { chatRoomName: string; chatRoomAvatar: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { chatRoomId } = req.params;
    const { chatRoomName, chatRoomAvatar } = req.body;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    await chatroomService.updateChatRoom(
      chatRoomId,
      chatRoomName,
      chatRoomAvatar
    );
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

const deleteChatRoom = async (
  req: Request<{ chatRoomId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { chatRoomId } = req.params;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    await chatroomService.deleteChatRoom(chatRoomId);
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

const postAddMember = async (
  req: Request<{ chatRoomId: string; memberId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { chatRoomId, memberId } = req.params;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    await chatroomService.addMember(chatRoomId, memberId);
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

const deleteRemoveMember = async (
  req: Request<{ chatRoomId: string; memberId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { chatRoomId, memberId } = req.params;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    await chatroomService.removeMember(chatRoomId, memberId);
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

export default {
  getUserChatRooms,
  postNewChatRoom,
  putChatRoom,
  deleteChatRoom,
  postAddMember,
  deleteRemoveMember,
};
