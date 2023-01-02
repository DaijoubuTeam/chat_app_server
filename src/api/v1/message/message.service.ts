import { StatusCodes } from 'http-status-codes';
import sendSocketToUser from '../../../common/sendSocketToUser';
import HttpException from '../../../exception';
import ChatRoom from '../../../models/chat_room';
import Message, { IMessage, MessageType } from '../../../models/message';
import constants from '../../../constants';
import getRawMessage from '../../../common/getRawMessage';
import { IUser } from '../../../models/user';

const sendMessage = async (
  userId: string,
  chatRoomId: string,
  content: string,
  type: MessageType
) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Chat room not found');
  }
  const message = new Message({
    chatRoomId: chatRoom._id,
    from: userId,
    content,
    type,
  });
  const messageDoc = await message.save();
  chatRoom.latestMessage = messageDoc._id;
  await chatRoom.save();
  const populatedMessage = await messageDoc.populate({
    path: 'from readed',
  });
  chatRoom.members.forEach((member) => {
    if (typeof member == 'string' || member instanceof String) {
      sendSocketToUser(
        member as string,
        constants.socketEvents.NEW_MESSAGE,
        getRawMessage(populatedMessage)
      );
    } else {
      sendSocketToUser(
        (member as IUser)._id,
        constants.socketEvents.NEW_MESSAGE,
        getRawMessage(populatedMessage)
      );
    }
  });
  return getRawMessage(populatedMessage);
};

const getChatRoomMessage = async (
  chatRoomId: string,
  userId: string,
  from: number,
  to: number
) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'chat room not found');
  }
  if (chatRoom.members.findIndex((id) => id === userId) === -1) {
    throw new HttpException(StatusCodes.FORBIDDEN, `forbidden request`);
  }
  if (to <= from) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'invalid query');
  }
  const messages = await Message.find({
    chatRoomId,
  })
    .populate({
      path: 'from readed',
    })
    .sort({ createdAt: 'desc' })
    .skip(from)
    .limit(to - from);
  return messages.map((message) => getRawMessage(message));
};

const getMessagesById = async (
  messageId: string,
  userId: string,
  before: number,
  after: number
) => {
  const message = await Message.findById(messageId).populate({
    path: 'from readed',
  });
  if (!message) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'chat room not found');
  }
  const chatroom = await ChatRoom.findById(message.chatRoomId);
  if (!chatroom || chatroom.members.findIndex((id) => id === userId) === -1) {
    throw new HttpException(StatusCodes.FORBIDDEN, `forbidden request`);
  }
  let beforeMessages: IMessage[] = [];
  if (before) {
    beforeMessages = await Message.find({
      createdAt: {
        $lt: message.createdAt,
      },
      chatRoomId: chatroom._id,
    })
      .populate({
        path: 'from readed',
      })
      .sort({ createdAt: 'desc' })
      .limit(before);
  }
  let afterMessages: IMessage[] = [];
  if (after) {
    afterMessages = await Message.find({
      createdAt: {
        $gt: message.createdAt,
      },
      chatRoomId: chatroom._id,
    })
      .populate({
        path: 'from readed',
      })
      .sort({ createdAt: 'asc' })
      .limit(after);
  }
  const messages = [...afterMessages.reverse(), message, ...beforeMessages];
  return messages.map((message) => getRawMessage(message));
};

export default { sendMessage, getChatRoomMessage, getMessagesById };
