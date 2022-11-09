import mongoose, { mongo } from 'mongoose';

enum NotifyType {
  mention = 'mention',
  friendRequest = 'friend-request',
  chatRoomRequest = 'chat-room-invitation',
}

interface INotification {
  notifyType: NotifyType;
  readed: boolean;
  notificationSender: string;
  notificationReceiver: string;
  chatRoom?: mongoose.Types.ObjectId;
  message?: mongoose.Types.ObjectId;
  createdAt: Date;
  updateAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    notifyType: { type: String, enum: NotifyType, required: true },
    readed: { type: Boolean, default: false },
    notificationSender: {
      type: String,
      required: true,
      ref: 'User',
    },
    notificationReceiver: {
      type: String,
      required: true,
      ref: 'User',
    },
    chatRoom: {
      type: mongoose.SchemaTypes.ObjectId,
      required: false,
      ref: 'ChatRoom',
      default: null,
    },
    message: {
      type: mongoose.SchemaTypes.ObjectId,
      required: false,
      ref: 'Message',
      default: null,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export { INotification, NotifyType };
export default Notification;
