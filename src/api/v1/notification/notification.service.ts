import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import Notification from '../../../models/notification';

const getNotification = async (userId: string) => {
  const notifications = await Notification.find({
    userId,
  });
  return notifications;
};

const removeNotification = async (userId: string, notificationId: string) => {
  const notification = await Notification.findById(notificationId);
  if (notification?.userId !== userId) {
    throw new HttpException(
      StatusCodes.FORBIDDEN,
      'User does not have this notification'
    );
  }
  await notification.delete();
};

const updateNotification = async (
  userId: string,
  notificationId: string,
  readed: boolean
) => {
  const notification = await Notification.findById(notificationId);
  if (notification?.userId !== userId) {
    throw new HttpException(
      StatusCodes.FORBIDDEN,
      'User does not have permission edit this notification'
    );
  }
  notification.readed = readed;
  await notification.save();
};

export default { getNotification, removeNotification, updateNotification };
