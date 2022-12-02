import mongoose from 'mongoose';
import { IChatRoom } from '../models/chat_room';
import { IMessage } from '../models/message';
import { IUser } from '../models/user';
import getRawChatRoom from './getRawChatRoom';
import getRawUser from './getRawUser';

const getRawMessage = (message: IMessage) => {
  const chatRoom: unknown =
    message.chatRoomId instanceof mongoose.Types.ObjectId
      ? undefined
      : getRawChatRoom(message.chatRoomId as IChatRoom);

  const chatRoomId =
    message.chatRoomId instanceof mongoose.Types.ObjectId
      ? message.chatRoomId.toString()
      : undefined;
  const from =
    typeof message.from === 'string' || message.from instanceof String
      ? message.from
      : getRawUser(message.from as unknown as IUser);
  const readed = message.readed.map((readed) => {
    if (typeof readed === 'string' || readed instanceof String) return readed;
    return getRawUser(readed as unknown as IUser);
  });
  return {
    chatRoom,
    chatRoomId: chatRoomId,
    from: from,
    content: message.content,
    readed: readed,
    id: message._id,
    type: message.type,
    createdAt: message.createdAt,
    updateAt: message.updateAt,
  };
};

export default getRawMessage;
