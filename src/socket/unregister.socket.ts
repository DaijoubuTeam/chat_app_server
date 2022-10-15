import SocketUser from '../models/socket';

const unregisterSocket = async (socketId: string) => {
  await SocketUser.findByIdAndDelete(socketId);
};

export default unregisterSocket;
