import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import User, { IUser } from '../../../models/user';
import ChatRoom, { CHAT_ROOM_TYPE, IChatRoom } from '../../../models/chat_room';
import mongoose from 'mongoose';

const getUserChatRooms = async (userId: string): Promise<IChatRoom[]> => {
  const user = await User.findOne({ uid: userId }).populate<{
    chatRooms: IChatRoom[];
  }>('chatRooms');
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
    members: [],
    type: CHAT_ROOM_TYPE.group,
  });
  return chatRoom.save();
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
    const memberUser = await User.findOne({ uid: member });
    if (memberUser) {
      memberUser.chatRooms = new mongoose.Types.Array(
        ...memberUser.chatRooms.filter(
          (chatRoom) => chatRoom.toString() !== chatRoomId
        )
      );
      await memberUser.save();
    }
  });
  await Promise.all(deleteMembers);
};

const addMember = async (chatRoomId: string, memberId: string) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  const member = await User.findOne({ uid: memberId });
  if (!chatRoom || !member) {
    throw new HttpException(
      StatusCodes.NOT_FOUND,
      'Chatroom or member not found'
    );
  }
  chatRoom.members = new mongoose.Types.Array(
    ...chatRoom.members.filter(
      (member) => member.toString() === member._id.toString()
    )
  );
  member.chatRooms = new mongoose.Types.Array(
    ...member.chatRooms.filter((chatRoom) => chatRoom.toString() === chatRoomId)
  );
};

export default {
  getUserChatRooms,
  createNewChatRoom,
  updateChatRoom,
  deleteChatRoom,
  addMember,
};
