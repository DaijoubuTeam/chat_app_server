import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import User, { IUser } from '../../../models/user';
import ChatRoom, { CHAT_ROOM_TYPE, IChatRoom } from '../../../models/chat_room';
import mongoose from 'mongoose';
import notificationService from '../notification/notification.service';
import { NotifyType } from '../../../models/notification';
import getRawChatRoom from '../../../common/getRawChatRoom';
import messageService from '../message/message.service';
import { MessageType, SystemMessageType } from '../../../models/message';
import getRawUser from '../../../common/getRawUser';

const getUserChatRooms = async (userId: string) => {
  const user = await User.findById(userId).populate({
    path: 'chatRooms',
    populate: [
      {
        path: 'latestMessage',
        populate: {
          path: 'from readed',
        },
      },
      {
        path: 'members',
      },
    ],
  });

  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user.chatRooms.map((chatRoom) => {
    const rawChatRoom = getRawChatRoom(chatRoom as unknown as IChatRoom);
    if (rawChatRoom.type === CHAT_ROOM_TYPE.personal) {
      const friend = rawChatRoom.members.find((member) => {
        return (member as any).uid !== userId;
      }) as unknown as IUser;
      rawChatRoom.chatRoomAvatar = friend.avatar;
      rawChatRoom.chatRoomName = friend.fullname;
    }
    return rawChatRoom;
  });
};

const createNewChatRoom = async (
  chatRoomName: string,
  chatRoomAvatar: string,
  userId: string
): Promise<IChatRoom> => {
  const chatRoom = new ChatRoom({
    chatRoomName,
    admin: [userId],
    members: [userId],
    type: CHAT_ROOM_TYPE.group,
    chatRoomAvatar,
  });
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const chatRoomDoc = await chatRoom.save();

  user.chatRooms.push(chatRoomDoc._id);
  await user.save();
  await messageService.sendMessage(
    userId,
    chatRoomDoc._id.toString(),
    SystemMessageType.createRoom,
    MessageType.system
  );
  return chatRoomDoc;
};

const updateChatRoom = async (
  chatRoomId: string,
  chatRoomName: string,
  chatRoomAvatar: string
) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Chat room not found');
  }
  chatRoom.chatRoomName = chatRoomName;
  chatRoom.chatRoomAvatar = chatRoomAvatar;
  await chatRoom.save();
};

const deleteChatRoom = async (chatRoomId: string) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Chat room not found');
  }
  const deleteMembers = chatRoom.members.map(async (member) => {
    const memberUser = await User.findById(member);
    await memberUser?.chatRooms.pull(chatRoom);
    return memberUser?.save();
  });

  const users = await User.find({ chatRooms: chatRoomId });
  const removeRequest = users.map(async (user) => {
    await user.chatRoomRequests.pull(chatRoomId);
    await user.save();
  });
  await Promise.all([
    ...deleteMembers,
    ChatRoom.findByIdAndDelete(chatRoomId),
    removeRequest,
  ]);
};

const sendChatRoomRequest = async (
  chatRoomId: string,
  senderId: string,
  userId: string
) => {
  const sender = await User.findById(senderId);
  const chatRoom = await ChatRoom.findById(chatRoomId);
  const user = await User.findById(userId);
  if (!chatRoom || !user || !sender) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      'Chatroom or member not found'
    );
  }
  if (
    chatRoom.members.find((member) => member.toString() === user._id.toString())
  ) {
    throw new HttpException(StatusCodes.CONFLICT, 'User has been in chat room');
  }
  user.chatRoomRequests.push(chatRoom._id);
  sender.chatRoomRequestsSent.push({
    chatRoom: chatRoom._id,
    to: userId,
  });
  await Promise.all([user.save(), sender.save()]);
  await notificationService.newNotification(
    senderId,
    userId,
    NotifyType.chatRoomRequest,
    chatRoom._id,
    null
  );
};

const removeMember = async (chatRoomId: string, memberId: string) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  const memberUser = await User.findById(memberId);
  if (!chatRoom || !memberUser) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      'Chatroom or member not found'
    );
  }
  if (
    !chatRoom.members.find(
      (member) => member.toString() === memberUser._id.toString()
    )
  ) {
    throw new HttpException(StatusCodes.CONFLICT, 'User is not in chat room');
  }
  if (
    chatRoom.admin.find(
      (admin) => admin.toString() === memberUser._id.toString()
    )
  ) {
    throw new HttpException(StatusCodes.CONFLICT, 'User is admin');
  }
  await messageService.sendMessage(
    memberId,
    chatRoomId,
    SystemMessageType.removeFromRoom,
    MessageType.system
  );
  chatRoom.members.pull(memberUser);
  memberUser.chatRooms.pull(chatRoom);
  await Promise.all([chatRoom.save(), memberUser.save()]);
};

const acceptJoinChatRoom = async (chatRoomId: string, userId: string) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  const user = await User.findById(userId);
  if (!chatRoom || !user) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      'User or chat room not found'
    );
  }
  if (
    user.chatRoomRequests.findIndex(
      (request) => request.toString() === chatRoomId
    ) === -1
  ) {
    throw new HttpException(
      StatusCodes.BAD_REQUEST,
      'User does not have the request'
    );
  }
  const sender = await User.findOne({
    'chatRoomRequestsSent.chatRoom': chatRoomId,
    'chatRoomRequestsSent.to': userId,
  });

  if (!sender) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'sender not found');
  }

  sender.chatRoomRequestsSent.pull({
    chatRoom: chatRoomId,
    to: userId,
  });
  user.chatRoomRequests.pull(chatRoomId);
  user.chatRooms.push(chatRoomId);
  chatRoom.members.push(userId);
  await Promise.all([user.save(), chatRoom.save(), sender.save()]);
  await messageService.sendMessage(
    userId,
    chatRoomId,
    SystemMessageType.joinRoom,
    MessageType.system
  );
};
const rejectJoinChatRoom = async (chatRoomId: string, userId: string) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  const user = await User.findById(userId);
  if (!chatRoom || !user) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      'User or chat room not found'
    );
  }
  if (
    user.chatRoomRequests.findIndex(
      (request) => request.toString() === chatRoomId
    ) === -1
  ) {
    throw new HttpException(
      StatusCodes.BAD_REQUEST,
      'User does not have the request'
    );
  }
  const sender = await User.findOne({
    'chatRoomRequestsSent.chatRoom': chatRoomId,
    'chatRoomRequestsSent.to': userId,
  });

  if (!sender) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'sender not found');
  }

  sender.chatRoomRequestsSent.pull({
    chatRoom: chatRoomId,
    to: userId,
  });
  user.chatRoomRequests.pull(chatRoomId);

  return Promise.all([user.save(), sender.save()]);
};

const leaveChatRoom = async (chatRoomId: string, userId: string) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  const user = await User.findById(userId);
  if (!chatRoom || !user) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      'User or chat room not found'
    );
  }
  if (
    user.chatRooms.findIndex(
      (chatroom) => chatroom.toString() === chatRoomId
    ) === -1
  ) {
    throw new HttpException(
      StatusCodes.BAD_REQUEST,
      'User does not in the chat room'
    );
  }

  if (chatRoom.admin.findIndex((admin) => admin == userId) !== -1) {
    throw new HttpException(
      StatusCodes.CONFLICT,
      'User is admin. Please delete chat room'
    );
  }
  user.chatRooms.pull(chatRoomId);
  chatRoom.members.pull(userId);

  await Promise.all([user.save(), chatRoom.save()]);
  await messageService.sendMessage(
    userId,
    chatRoomId,
    SystemMessageType.leftRoom,
    MessageType.system
  );
};

const getChatRoomRequests = async (userId: string) => {
  const user = await User.findById(userId).populate<{
    chatRoomRequests: IChatRoom[];
  }>('chatRoomRequests');
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user.chatRoomRequests.map((request: IChatRoom) => {
    return getRawChatRoom(request);
  });
};

const getChatRoomRequestsSent = async (userId: string) => {
  const user = await User.findById(userId).populate<{
    chatRoomRequestsSent: {
      chatRoom: IChatRoom;
      to: IUser;
    }[];
  }>({
    path: 'chatRoomRequestsSent',
    populate: 'chatRoom to',
  });
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user.chatRoomRequestsSent.map(
    (request: { chatRoom: IChatRoom; to: IUser }) => {
      return {
        chatRoom: getRawChatRoom(request.chatRoom),
        to: getRawUser(request.to),
      };
    }
  );
};

const getChatRoom = async (chatRoomId: string, userId: string) => {
  const chatRoom = await ChatRoom.findOne({
    _id: chatRoomId,
    members: userId,
  })
    .populate({
      path: 'latestMessage',
      populate: {
        path: 'from readed',
      },
    })
    .populate({
      path: 'members',
    })
    .exec();
  if (!chatRoom) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'chat room not found');
  }
  const rawChatRoom = getRawChatRoom(chatRoom);
  if (rawChatRoom.type === CHAT_ROOM_TYPE.personal) {
    const friend = rawChatRoom.members.find((member) => {
      return (member as any).uid !== userId;
    }) as unknown as IUser;
    rawChatRoom.chatRoomAvatar = friend.avatar;
    rawChatRoom.chatRoomName = friend.fullname;
  }
  return rawChatRoom;
};

const deleteChatRoomRequestsSent = async (
  userId: string,
  chatRoomId: string,
  friendId: string
) => {
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);
  if (!user || !friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  user.chatRoomRequestsSent.pull({
    chatRoom: chatRoomId,
    to: friendId,
  });
  friend.chatRoomRequests.pull(chatRoomId);
  await Promise.all([user.save(), friend.save()]);
};

export default {
  getUserChatRooms,
  createNewChatRoom,
  updateChatRoom,
  deleteChatRoom,
  sendChatRoomRequest,
  removeMember,
  acceptJoinChatRoom,
  rejectJoinChatRoom,
  getChatRoomRequests,
  getChatRoom,
  leaveChatRoom,
  getChatRoomRequestsSent,
  deleteChatRoomRequestsSent,
};
