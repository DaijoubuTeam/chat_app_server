import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import User from '../../../models/user';
import ChatRoom, { CHAT_ROOM_TYPE, IChatRoom } from '../../../models/chat_room';
import mongoose from 'mongoose';
import notificationService from '../notification/notification.service';
import { NotifyType } from '../../../models/notification';
import getRawChatRoom from '../../../common/getRawChatRoom';
import { IMessage } from '../../../models/message';

const getUserChatRooms = async (userId: string): Promise<IChatRoom[]> => {
  const user = await User.findById(userId).populate<{
    chatRooms: IChatRoom[];
  }>({
    path: 'chatRooms',
    populate: {
      path: 'latestMessage',
      populate: {
        path: 'from readed',
      },
    },
  });

  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user.chatRooms;
};

const createNewChatRoom = async (
  chatRoomName: string,
  userId: string
): Promise<IChatRoom> => {
  const chatRoom = new ChatRoom({
    chatRoomName,
    admin: [userId],
    members: [userId],
    type: CHAT_ROOM_TYPE.group,
  });
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const chatRoomDoc = await chatRoom.save();

  user.chatRooms.push(chatRoomDoc._id);
  await user.save();
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
    if (memberUser) {
      memberUser.chatRooms = new mongoose.Types.Array(
        ...memberUser.chatRooms.filter(
          (chatRoom) => chatRoom.toString() !== chatRoomId
        )
      );
    }
    return memberUser?.save();
  });
  await Promise.all([...deleteMembers, ChatRoom.findByIdAndDelete(chatRoomId)]);
};

const sendChatRoomRequest = async (
  chatRoomId: string,
  senderId: string,
  userId: string
) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  const user = await User.findById(userId);
  if (!chatRoom || !user) {
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
  await user.save();
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
  chatRoom.members = new mongoose.Types.Array(
    ...chatRoom.members.filter(
      (member) => member.toString() === memberUser._id.toString()
    )
  );
  memberUser.chatRooms = new mongoose.Types.Array(
    ...memberUser.chatRooms.filter(
      (chatroom) => chatroom.toString() === chatRoom._id.toString()
    )
  );
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
  user.chatRoomRequests.pull(chatRoomId);
  user.chatRooms.push(chatRoomId);
  chatRoom.members.push(userId);
  return Promise.all([user.save(), chatRoom.save()]);
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
  user.chatRoomRequests.pull(chatRoomId);

  return Promise.all([user.save()]);
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
  return chatRoom;
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
};
