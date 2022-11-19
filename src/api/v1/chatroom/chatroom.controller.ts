import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import chatroomService from './chatroom.service';
import HttpException from '../../../exception';
import getRawChatRoom from '../../../common/getRawChatRoom';
import isLink from '../../../validator/is_link';

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
    res.status(StatusCodes.OK).json(chatRooms);
  } catch (error) {
    next(error);
  }
};

const postNewChatRoom = async (
  req: Request<
    unknown,
    unknown,
    { chatRoomName: string; chatRoomAvatar: string; members: string[] }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { chatRoomName, chatRoomAvatar, members } = req.body;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const chatRoom = await chatroomService.createNewChatRoom(
      chatRoomName,
      chatRoomAvatar,
      user._id
    );
    await Promise.all(
      members.map(async (member) => {
        if (member == user._id) {
          return;
        }
        await chatroomService.sendChatRoomRequest(
          chatRoom._id.toString(),
          user._id,
          member
        );
      })
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

const sendChatRoomRequest = async (
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
    await chatroomService.sendChatRoomRequest(chatRoomId, user._id, memberId);
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

const acceptJoinChatRoom = async (
  req: Request<{ chatRoomId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatRoomId } = req.params;
    const user = req.user;
    if (user == null) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    await chatroomService.acceptJoinChatRoom(chatRoomId, user._id);
    res.status(StatusCodes.OK).json('Join successful');
  } catch (error) {
    next(error);
  }
};
const rejectJoinChatRoom = async (
  req: Request<{ chatRoomId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatRoomId } = req.params;
    const user = req.user;
    if (user == null) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    await chatroomService.rejectJoinChatRoom(chatRoomId, user._id);
    res.status(StatusCodes.OK).json('Reject successful');
  } catch (error) {
    next(error);
  }
};

const getChatRoomRequests = async (
  req: Request<{ chatRoomId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (user == null) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    const chatRooms = await chatroomService.getChatRoomRequests(user._id);
    res.status(StatusCodes.OK).json({ chatRooms });
  } catch (error) {
    next(error);
  }
};

const getChatRoom = async (
  req: Request<{ chatRoomId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { chatRoomId } = req.params;
    if (user == null) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
    }
    const chatRoom = await chatroomService.getChatRoom(chatRoomId, user._id);
    res.status(StatusCodes.OK).json(chatRoom);
  } catch (error) {
    next(error);
  }
};

export default {
  getUserChatRooms,
  postNewChatRoom,
  putChatRoom,
  deleteChatRoom,
  sendChatRoomRequest,
  deleteRemoveMember,
  acceptJoinChatRoom,
  rejectJoinChatRoom,
  getChatRoomRequests,
  getChatRoom,
};
