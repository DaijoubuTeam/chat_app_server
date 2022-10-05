import mongoose, { model, Types } from 'mongoose';

const { Schema } = mongoose;

const CHAT_ROOM_TYPE = {
  group: 'group',
  personal: 'personal',
};

interface IChatRoom {
  _id: mongoose.Types.ObjectId;
  chatRoomName: string;
  chatRoomAvatar: string;
  members: Types.Array<string>;
  admin: Types.Array<string>;
  type: string;
}

const chatRoomSchema = new Schema<IChatRoom>({
  chatRoomName: { type: String, required: false, default: null },
  chatRoomAvatar: { type: String, required: false, default: null },
  members: [{ type: String, ref: 'User' }],
  admin: [{ type: String, ref: 'User' }],
  type: [
    { type: String, enum: [CHAT_ROOM_TYPE.group, CHAT_ROOM_TYPE.personal] },
  ],
});

const ChatRoom = model<IChatRoom>('ChatRoom', chatRoomSchema);

export { IChatRoom, CHAT_ROOM_TYPE };
export default ChatRoom;
