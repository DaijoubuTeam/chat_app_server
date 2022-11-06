import { Socket } from 'socket.io';
import SocketUser from '../models/socket';

const registerSocket = async (uid: string, socketId: string) => {
  const socket = await SocketUser.findById(socketId);
  if (socket != null) {
    throw new Error('socket has been registered');
  }
  await SocketUser.create({
    _id: socketId,
    uid: uid,
  });
};

export default registerSocket;
