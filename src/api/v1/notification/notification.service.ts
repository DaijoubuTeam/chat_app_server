import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import getRawNotification from '../../../common/getRawNotification';
import sendSocketToUser from '../../../common/sendSocketToUser';
import constants from '../../../constants';
import HttpException from '../../../exception';
import Notification, { NotifyType } from '../../../models/notification';

const getNotification = async (userId: string) => {
  const notifications = await Notification.find({
    notificationReceiver: userId,
  }).populate({
    path: 'notificationSender notificationReceiver chatRoom message',
  });
  const notificationDTOs = notifications.map((notification) =>
    getRawNotification(notification)
  );
  return notificationDTOs;
};

const newNotification = async (
  senderId: string,
  receiverId: string,
  notifyType: NotifyType,
  chatRoom: mongoose.Types.ObjectId | null,
  message: mongoose.Types.ObjectId | null
) => {
  const notification = new Notification({
    notificationSender: senderId,
    notificationReceiver: receiverId,
    notifyType: notifyType,
    chatRoom: chatRoom,
    message: message,
  });
  await notification.save();
  const populatedNotification = await notification.populate({
    path: 'notificationSender notificationReceiver chatRoom message',
  });
  await sendSocketToUser(
    receiverId,
    constants.socketEvents.NEW_NOTIFICATION,
    getRawNotification(populatedNotification)
  );
};

const putToggleNotificationAsRead = async (
  userId: string,
  notificationId: string
) => {
  const notification = await Notification.findById(notificationId);
  if (notification?.notificationReceiver !== userId) {
    throw new HttpException(
      StatusCodes.FORBIDDEN,
      'User does not have this notification'
    );
  }
  notification.readed = !notification.readed;
  await notification.save();
};

const removeNotification = async (userId: string, notificationId: string) => {
  const notification = await Notification.findById(notificationId);
  if (notification?.notificationReceiver !== userId) {
    throw new HttpException(
      StatusCodes.FORBIDDEN,
      'User does not have this notification'
    );
  }
  await notification.delete();
};

export default {
  getNotification,
  removeNotification,
  newNotification,
  putToggleNotificationAsRead,
};
