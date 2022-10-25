import mongoose, { mongo } from 'mongoose';

enum NotifyType {
  mention = 'mention',
  friendRequest = 'friend request',
  groupInvitation = 'group invitation',
}

interface INotification {
  userId: string;
  notifyType: NotifyType;
  readed: boolean;
  actionDoer: string;
  actionTarget: string;
  createdAt: Date;
  updateAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: { type: String, ref: 'User', required: true },
    notifyType: { type: String, enum: NotifyType, required: true },
    readed: { type: Boolean, default: false },
    actionDoer: {
      type: String,
      required: true,
      ref: 'User',
    },
    actionTarget: { type: String, required: true },
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export { INotification, NotifyType };
export default Notification;
