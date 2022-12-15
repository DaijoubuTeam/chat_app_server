import mongoose, { model } from 'mongoose';
import { IChatRoom } from './chat_room';
import { IUser } from './user';

const { Schema } = mongoose;

export enum SystemMessageType {
  joinRoom = 'joinRoom',
  becomeFriend = 'becomeFriend',
  leftRoom = 'leftRoom',
  removeFromRoom = 'removedFromRoom',
  createRoom = 'createRoom',
  callCancelled = 'callCancelled',
}

export enum MessageType {
  Text = 'text',
  Image = 'image',
  video = 'video',
  record = 'record',
  emoji = 'emoji',
  sticker = 'sticker',
  system = 'system',
}

interface IMessage {
  _id: mongoose.Types.ObjectId;
  chatRoomId: mongoose.Types.ObjectId | IChatRoom;
  from: string | IUser;
  content: string;
  readed: mongoose.Types.Array<string | IUser>;
  createdAt: Date;
  updateAt: Date;
  type: MessageType;
}

const messageSchema = new Schema<IMessage>(
  {
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    from: { type: String, required: true, ref: 'User' },
    content: { type: String, required: true },
    readed: [{ type: String, ref: 'User' }],
    type: {
      type: String,
      enum: MessageType,
      required: true,
      default: MessageType.Text,
    },
  },
  { timestamps: true }
);

const Message = model<IMessage>('Message', messageSchema);

export { IMessage };
export default Message;
