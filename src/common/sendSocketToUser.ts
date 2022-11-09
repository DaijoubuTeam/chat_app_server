import { io } from '..';
import SocketUser from '../models/socket';

const sendSocketToUser = async (
  userId: string,
  eventName: string,
  data: unknown
) => {
  try {
    const socketUsers = await SocketUser.find({
      uid: userId,
    });
    socketUsers.forEach((socketUser) =>
      io.to(socketUser._id).emit(eventName, data)
    );
  } catch (error) {
    console.log(error);
  }
};
export default sendSocketToUser;
