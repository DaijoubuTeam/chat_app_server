import { INotification, NotifyType } from '../models/notification';
import { IUser } from '../models/user';
import mongoose from 'mongoose';
import { IChatRoom } from '../models/chat_room';
import { IMessage } from '../models/message';
import getRawUser from './getRawUser';
import getRawChatRoom from './getRawChatRoom';
import getRawMessage from './getRawMessage';

const getRawNotification = (notification: INotification) => {
  let notificationSender;
  if (
    !(
      typeof notification.notificationSender == 'string' ||
      notification.notificationSender instanceof String
    )
  ) {
    notificationSender = getRawUser(notification.notificationSender);
  }
  let notificationReceiver;
  if (
    !(
      typeof notification.notificationReceiver == 'string' ||
      notification.notificationReceiver instanceof String
    )
  ) {
    notificationReceiver = getRawUser(notification.notificationReceiver);
  }
  let chatRoom;
  if (
    notification.chatRoom &&
    !(notification.chatRoom instanceof mongoose.Types.ObjectId)
  ) {
    chatRoom = getRawChatRoom(notification.chatRoom as unknown as IChatRoom);
  }
  let message;
  if (
    notification.message &&
    !(notification.message instanceof mongoose.Types.ObjectId)
  ) {
    chatRoom = getRawMessage(notification.message as unknown as IMessage);
  }
  const rs = {
    id: notification._id,
    notifyType: notification.notifyType,
    readed: notification.readed,
    notificationSender: notificationSender
      ? notificationSender
      : notification.notificationSender,
    notificationReceiver: notificationReceiver
      ? notificationReceiver
      : notification.notificationReceiver,
    chatRoom: notification.chatRoom
      ? chatRoom
        ? chatRoom
        : notification.chatRoom
      : undefined,
    message: notification.message
      ? message
        ? message
        : notification.message
      : undefined,
    createdAt: notification.createdAt,
    updateAt: notification.updateAt,
  };
  return rs;
};
export default getRawNotification;
