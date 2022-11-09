import mongoose, { model, Types } from 'mongoose';
import { IMessage } from './message';
import { IUser } from './user';

const { Schema } = mongoose;

const CHAT_ROOM_TYPE = {
  group: 'group',
  personal: 'personal',
};

interface IChatRoom {
  _id: mongoose.Types.ObjectId;
  chatRoomName: string;
  chatRoomAvatar: string;
  members: Types.Array<string | IUser>;
  admin: Types.Array<string>;
  type: string;
  latestMessage: Types.ObjectId | IMessage;
}

const chatRoomSchema = new Schema<IChatRoom>({
  chatRoomName: { type: String, required: false, default: null },
  chatRoomAvatar: { type: String, required: false, default: null },
  members: [{ type: String, ref: 'User' }],
  admin: [{ type: String, ref: 'User' }],
  type: { type: String, enum: [CHAT_ROOM_TYPE.group, CHAT_ROOM_TYPE.personal] },
  latestMessage: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'Message',
  },
});

const ChatRoom = model<IChatRoom>('ChatRoom', chatRoomSchema);

export { IChatRoom, CHAT_ROOM_TYPE };
export default ChatRoom;
