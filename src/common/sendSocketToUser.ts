import { io } from '..';
import SOCKET_EVENT from '../constants/socket_event';
import Device from '../models/device';
import SocketUser from '../models/socket';
import {
  sendPushMessage,
  sendPushNotificationToDevice,
} from './sendPushNotificationToDevice';

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
      devices.map(async (device) => {
        if (eventName == SOCKET_EVENT.NEW_MESSAGE) {
          await sendPushMessage(
            device._id,
            'New Message',
            'You have new message'
          );
        } else {
          await sendPushMessage(
            device._id,
            'New Notifcation',
            'You have new notification'
          );
        }
      })
    );
  } catch (error) {
    console.log(error);
  }
};

export default sendSocketToUser;
