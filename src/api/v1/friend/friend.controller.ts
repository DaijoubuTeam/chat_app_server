import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import getRawUser from '../../../common/getRawUser';
import HttpException from '../../../exception';
import { MessageType, SystemMessageType } from '../../../models/message';
import { IUser } from '../../../models/user';
import messageService from '../message/message.service';
import friendService from './friend.service';
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
    const userFriendsList = await Promise.all(
      ((await servive.getFriendList(user._id)) as unknown as IUser[]).map(
        async (user) => {
          const rawUser = getRawUser(user);
          const chatRoomId = await friendService.getPersonalChatRoom(
            rawUser.uid,
            user._id
          );
          return {
            ...rawUser,
            personalChatRoomId: chatRoomId,
          };
        }
      )
    );
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

const getFriendRequestsSent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const userFriendRequestsList = await servive.getFriendRequestSentList(
      user._id
    );
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

const unsendFriendRequests = async (
  req: Request<{ id: string }, unknown, unknown, { action: string }>,
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
    await servive.unsendFriendRequests(user._id, id);
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (
  req: Request<{ id: string }, unknown, { message: string; type: MessageType }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { message, type } = req.body;
    if (!user || !message || !id) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'Bad request: Invalid user, messsage or chatRoom id'
      );
    }

    const chatRoom = await friendService.getPersonalChatroom(user._id, id);
    const messageDTO = await messageService.sendMessage(
      user._id,
      chatRoom._id.toString(),
      message,
      type
    );
    res.status(StatusCodes.CREATED).json({ message: messageDTO });
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
  getFriendRequestsSent,
  unsendFriendRequests,
  sendMessage,
};
