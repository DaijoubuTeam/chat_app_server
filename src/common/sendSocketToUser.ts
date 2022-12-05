import { io } from '..';
import Device from '../models/device';
import SocketUser from '../models/socket';
import { sendPushNotificationToDevice } from './sendPushNotificationToDevice';

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
    const devices = await Device.find({
      uid: userId,
    });

    await Promise.all(
      devices.map((device) =>
        sendPushNotificationToDevice(device._id, eventName, data)
      )
    );
  } catch (error) {
    console.log(error);
  }
};

export default sendSocketToUser;
