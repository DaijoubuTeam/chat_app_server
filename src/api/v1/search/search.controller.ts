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
    const filteredUser = await searchService.filterUserFriend(
      user._id,
      userIds
    );
    res.status(StatusCodes.OK).json(filteredUser);
  } catch (error) {
    next(error);
  }
};

const searchChatRoom = async (
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
    const chatRoomIds = await searchService.searchChatRoom(q, user._id);
    const filteredChatRoom = await searchService.filterChatRoom(chatRoomIds);
    res.status(StatusCodes.OK).json(filteredChatRoom);
  } catch (error) {
    next(error);
  }
};

const searchMessage = async (
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
    const messageIds = await searchService.searchMessages(
      q,
      user.chatRooms.map((chatroom) => chatroom.toString())
    );
    const filteredMessages = await searchService.filterMessage(
      messageIds,
      user._id
    );
    res.status(StatusCodes.OK).json(filteredMessages);
  } catch (error) {
    next(error);
  }
};

const search = async (
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
    // Search user
    const userIds = await searchService.searchUsers(q, user.friends);
    const filteredUser = await searchService.filterUserFriend(userIds);
    // Seach chat room
    const chatRoomIds = await searchService.searchChatRoom(q, user._id);
    const filteredChatRoom = await searchService.filterChatRoom(chatRoomIds);
    // Search message
    const messageIds = await searchService.searchMessages(
      q,
      user.chatRooms.map((chatroom) => chatroom.toString())
    );
    const filteredMessages = await searchService.filterMessage(
      messageIds,
      user._id
    );
    // Return
    res.status(StatusCodes.OK).json({
      users: filteredUser,
      chatRooms: filteredChatRoom,
      messages: filteredMessages,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  searchUser,
  searchChatRoom,
  searchMessage,
  search,
};
