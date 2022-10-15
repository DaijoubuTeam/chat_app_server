import mongoose, { model } from 'mongoose';

const { Schema } = mongoose;

interface IMessage {
  chatRoomId: mongoose.Types.ObjectId;
  from: string;
  content: string;
}

const messageSchema = new Schema<IMessage>(
  {
    chatRoomId: { type: Schema.Types.ObjectId, required: true },
    from: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = model<IMessage>('Message', messageSchema);

export { IMessage };
export default Message;
