import { IMessage } from '../models/message';
import { IUser } from '../models/user';
import getRawUser from './getRawUser';

const getRawMessage = (message: IMessage) => {
  if (typeof message.from === 'string' || message.from instanceof String)
    return {
      chatRoomId: message.chatRoomId,
      from: message.from,
      content: message.content,
      readed: message.readed,
      id: message._id,
      createdAt: message.createdAt,
      updateAt: message.updateAt,
    };
  const readed = message.readed.map((readed) => {
    if (typeof readed === 'string' || readed instanceof String) return readed;
    return getRawUser(readed as unknown as IUser);
  });
  return {
    chatRoomId: message.chatRoomId,
    from: getRawUser(message.from as unknown as IUser),
    content: message.content,
    readed: readed,
    id: message._id,
    createdAt: message.createdAt,
    updateAt: message.updateAt,
  };
};

export default getRawMessage;
