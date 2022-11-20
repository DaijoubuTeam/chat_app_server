import mongoose, { model } from 'mongoose';
import { IChatRoom } from './chat_room';
import { IUser } from './user';

const { Schema } = mongoose;

interface IMessage {
  _id: mongoose.Types.ObjectId;
  chatRoomId: mongoose.Types.ObjectId | IChatRoom;
  from: string | IUser;
  content: string;
  readed: mongoose.Types.Array<string | IUser>;
  createdAt: Date;
  updateAt: Date;
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
  },
  { timestamps: true }
);

const Message = model<IMessage>('Message', messageSchema);

export { IMessage };
export default Message;
