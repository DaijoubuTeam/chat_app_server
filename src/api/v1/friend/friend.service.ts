import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import ChatRoom, { CHAT_ROOM_TYPE, IChatRoom } from '../../../models/chat_room';
import User, { IUser } from '../../../models/user';
import Notification, { NotifyType } from '../../../models/notification';
import notificationService from '../notification/notification.service';
import messageService from '../message/message.service';
import { MessageType, SystemMessageType } from '../../../models/message';
import getRawChatRoom from '../../../common/getRawChatRoom';
import { Types } from 'mongoose';
import sendSocketToUser from '../../../common/sendSocketToUser';
import SOCKET_EVENT from '../../../constants/socket_event';

const getFriendList = async (userId: string) => {
  const user: IUser | null = await User.findById(userId)
    .populate(
      'friends',
      '-friends -friendRequests -friendRequestsSent -bans -isEmailVerified -isProfileFilled -chatRooms'
    )
    .exec();

  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }

  return user.friends;
};

const getFriendRequestList = async (userId: string) => {
  const user: IUser | null = await User.findById(userId)
    .populate(
      'friendRequests',
      '-friends -friendRequests -friendRequestsSent -bans -isEmailVerified -isProfileFilled -chatRooms'
    )
    .exec();

  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }

  return user.friendRequests;
};

const getFriendRequestSentList = async (userId: string) => {
  const user: IUser | null = await User.findById(userId)
    .populate(
      'friendRequestsSent',
      '-friends -friendRequests -friendRequestsSent -bans -isEmailVerified -isProfileFilled -chatRooms'
    )
    .exec();

  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }

  return user.friendRequestsSent;
};

const sendFriendRequest = async (userId: string, friendId: string) => {
  if (userId === friendId) {
    throw new HttpException(
      StatusCodes.BAD_REQUEST,
      "Can't not add friend self"
    );
  }
  const friend = await User.findById(friendId);
  const user = await User.findById(userId);
  if (!friend || !user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (friend.bans.find((banId) => banId.toString() === userId)) {
    throw new HttpException(StatusCodes.CONFLICT, 'User has been banned');
  }
  if (friend.friendRequests.find((request) => request.toString() === userId))
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Request has been sent');
  if (user.friends.find((friend) => friend === friendId)) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Have been friend');
  }
  friend.friendRequests.push(userId);
  user.friendRequestsSent.push(friendId);
  await Promise.all([friend.save(), user.save()]);
  await notificationService.newNotification(
    userId,
    friend._id,
    NotifyType.friendRequest,
    null,
    null
  );
};

const removeFriend = async (userId: string, friendId: string) => {
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);
  if (!user || !friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const friendIndex = user.friends.findIndex(
    (req) => req.toString() == friendId
  );
  if (friendIndex === -1)
    throw new HttpException(StatusCodes.BAD_REQUEST, 'User not be found');
  user.friends.pull(friendId);
  friend.friends.pull(userId);
  const chatRoom = await deletePersonalChatRoom(userId, friendId);
  user.chatRooms.pull(chatRoom?._id);
  friend.chatRooms.pull(chatRoom?._id);
  return Promise.all([
    user.save(),
    friend.save(),
    sendSocketToUser(userId, SOCKET_EVENT.FRIEND_DELETED, null),
    sendSocketToUser(friendId, SOCKET_EVENT.FRIEND_DELETED, null),
  ]);
};

const acceptRequest = async (userId: string, friendId: string) => {
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);
  if (!user || !friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const friendRequestIndex = user.friendRequests.findIndex(
    (req) => req.toString() == friendId
  );
  if (friendRequestIndex === -1) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Request not be found');
  }
  user.friendRequests.pull(friendId);
  friend.friendRequestsSent.pull(userId);
  user.friends.push(friendId);
  friend.friends.push(userId);
  const chatroom = await createPersonalChatRoom(userId, friendId);
  user.chatRooms.push(chatroom.id);
  friend.chatRooms.push(chatroom.id);
  const deleteNotification = Notification.findOneAndDelete({
    notifyType: NotifyType.friendRequest,
    notificationReceiver: userId,
    notificationSender: friendId,
  });
  await Promise.all([user.save(), friend.save(), deleteNotification]);
};

const deniedRequest = async (userId: string, friendId: string) => {
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);
  if (!user || !friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const friendRequestIndex = user.friendRequests.findIndex(
    (req) => req.toString() == friendId
  );
  if (friendRequestIndex === -1) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Request not be found');
  }
  user.friendRequests.pull(friendId);
  friend.friendRequestsSent.pull(userId);
  const deleteNotification = Notification.findOneAndDelete({
    notifyType: NotifyType.friendRequest,
    notificationReceiver: userId,
    notificationSender: friendId,
  });
  await Promise.all([user.save(), friend.save(), deleteNotification]);
};

const banUser = async (userId: string, bannedUserId: string) => {
  const user = await User.findById(userId);
  const bannedUser = await User.findById(bannedUserId);
  if (!user || !bannedUser) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (user.friends.find((friend) => friend.toString() === bannedUserId)) {
    throw new HttpException(StatusCodes.CONFLICT, 'User is friend');
  }
  if (user.bans.find((ban) => ban.toString() == bannedUserId)) {
    throw new HttpException(StatusCodes.CONFLICT, 'User has been banned');
  }
  bannedUser.friendRequests.pull(userId);
  user.friendRequests.pull(bannedUserId);
  user.friendRequestsSent.pull(bannedUserId);
  bannedUser.friendRequestsSent.pull(userId);
  user.bans.push(bannedUserId);
  const deleteNotification = Notification.findOneAndDelete({
    notifyType: NotifyType.friendRequest,
    notificationReceiver: userId,
    notificationSender: bannedUserId,
  });
  await Promise.all([user.save(), bannedUser.save(), deleteNotification]);
};

const unbanUser = async (userId: string, bannedUserId: string) => {
  const user = await User.findById(userId);
  const bannedUser = await User.findById(bannedUserId);
  if (!user || !bannedUser) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (!user.bans.find((ban) => ban.toString() === bannedUserId)) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User has not been banned');
  }

  user.bans.pull(bannedUserId);

  await user.save();
};

const createPersonalChatRoom = async (userId: string, friendId: string) => {
  const chatRoom = await ChatRoom.create({
    members: [userId, friendId],
    type: CHAT_ROOM_TYPE.personal,
  });
  await messageService.sendMessage(
    userId,
    chatRoom._id.toString(),
    SystemMessageType.becomeFriend,
    MessageType.system
  );
  return chatRoom;
};

const deletePersonalChatRoom = async (userId: string, friendId: string) => {
  return ChatRoom.findOneAndDelete({
    members: { $all: [userId, friendId] },
    type: CHAT_ROOM_TYPE.personal,
  });
};

const unsendFriendRequests = async (userId: string, friendId: string) => {
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);
  if (!user || !friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'user not found');
  }
  user.friendRequestsSent.pull(friendId);
  friend.friendRequests.pull(userId);
  await Promise.all([
    user.save(),
    friend.save(),
    Notification.findOneAndDelete({
      notificationSender: userId,
      notificationReceiver: friendId,
      notifyType: NotifyType.friendRequest,
    }),
  ]);
};

const getPersonalChatroom = async (
  userId: string,
  friendId: string
): Promise<IChatRoom & { _id: Types.ObjectId }> => {
  const chatRoom = await ChatRoom.findOne({
    members: { $all: [userId, friendId] },
    type: CHAT_ROOM_TYPE.personal,
  });
  if (!chatRoom) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Is not friend');
  }
  return chatRoom;
};
export default {
  getFriendList,
  addFriendRequestList: sendFriendRequest,
  removeFriend,
  acceptRequest,
  deniedRequest,
  banUser,
  unbanUser,
  getFriendRequestList,
  getFriendRequestSentList,
  unsendFriendRequests,
  getPersonalChatroom,
};
