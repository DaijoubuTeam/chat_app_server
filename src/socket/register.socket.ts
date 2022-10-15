import SocketUser from '../models/socket';

const registerSocket = async (uid: string, socketId: string) => {
  await SocketUser.create({
    _id: socketId,
    uid: uid,
  });
};

export default registerSocket;
