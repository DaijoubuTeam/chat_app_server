import { StatusCodes } from 'http-status-codes';
import { io } from '../../../..';
import HttpException from '../../../exception';
import ChatRoom from '../../../models/chat_room';
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

export default { sendMessage };
