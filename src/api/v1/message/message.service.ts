import { StatusCodes } from 'http-status-codes';
import sendSocketToUser from '../../../common/sendSocketToUser';
import HttpException from '../../../exception';
import ChatRoom from '../../../models/chat_room';
import Message from '../../../models/message';
import constants from '../../../constants';
import getRawMessage from '../../../common/getRawMessage';

const sendMessage = async (
  userId: string,
  chatRoomId: string,
  content: string
) => {
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Chat room not found');
  }
  const message = new Message({
    chatRoomId: chatRoom._id,
    from: userId,
    content,
  });
  const messageDoc = await message.save();
  chatRoom.latestMessage = messageDoc._id;
  await chatRoom.save();
  chatRoom.members.forEach((member) => {
    sendSocketToUser(
      member,
      constants.socketEvents.NEW_MESSAGE,
      getRawMessage(message)
    );
  });
  return getRawMessage(messageDoc);
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

export default { sendMessage, getChatRoomMessage };
