import mongoose, { isValidObjectId } from 'mongoose';
import { IChatRoom } from '../models/chat_room';
import { IMessage } from '../models/message';
import { IUser } from '../models/user';
import getRawMessage from './getRawMessage';
import getRawUser from './getRawUser';

const getRawChatRoom = (chatroom: IChatRoom) => {
  const members = chatroom.members.map((member) => {
    if (typeof member == 'string' || member instanceof String) {
      return member;
    } else {
      return getRawUser(member as unknown as IUser);
    }
  });
  if (!chatroom.latestMessage) {
    return {
      chatRoomName: chatroom.chatRoomName,
      chatRoomAvatar: chatroom.chatRoomAvatar,
      members: members,
      admin: chatroom.admin,
      type: chatroom.type,
      chatRoomId: chatroom._id,
    };
  }
  const rawChatRoom = {
    chatRoomName: chatroom.chatRoomName,
    chatRoomAvatar: chatroom.chatRoomAvatar,
    members: members,
    admin: chatroom.admin,
    type: chatroom.type,
    chatRoomId: chatroom._id,
    latestMessage: isValidObjectId(chatroom.latestMessage.toString())
      ? chatroom.latestMessage
      : getRawMessage(chatroom.latestMessage as unknown as IMessage),
  };
  return rawChatRoom;
};
export default getRawChatRoom;
