import mongoose, { isValidObjectId } from 'mongoose';
import { IChatRoom } from '../models/chat_room';
import { IMessage } from '../models/message';
import getRawMessage from './getRawMessage';

const getRawChatRoom = (chatroom: IChatRoom) => {
  if (!chatroom.latestMessage) {
    return {
      chatRoomName: chatroom.chatRoomName,
      chatRoomAvatar: chatroom.chatRoomAvatar,
      members: chatroom.members,
      admin: chatroom.admin,
      type: chatroom.type,
      chatRoomId: chatroom._id,
    };
  }
  const rawChatRoom = {
    chatRoomName: chatroom.chatRoomName,
    chatRoomAvatar: chatroom.chatRoomAvatar,
    members: chatroom.members,
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
