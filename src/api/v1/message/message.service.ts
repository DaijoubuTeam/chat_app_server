import { StatusCodes } from 'http-status-codes';
import { io } from '../../..';
import HttpException from '../../../exception';
import ChatRoom, { IChatRoom } from '../../../models/chat_room';
import Message from '../../../models/message';
import SocketUser from '../../../models/socket';

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
  await message.save();
  const sendMessageSocket = chatRoom.members.map(async (member) => {
    const memberSocketUsers = await SocketUser.find({
      uid: member,
    });
    memberSocketUsers.forEach((socketUser) =>
      io.to(socketUser._id).emit('new-message', message.toJSON())
    );
  });
  await Promise.all(sendMessageSocket);
};

const getChatRoomMessage = async (
  chatRoomId: string,
  userId: string,
  from: number,
  to: number
): Promise<IChatRoom[]> => {
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
    .sort({ createdAt: 'desc' })
    .skip(from)
    .limit(to - from);
  return messages.map((message) => message.toObject());
};

export default { sendMessage, getChatRoomMessage };
