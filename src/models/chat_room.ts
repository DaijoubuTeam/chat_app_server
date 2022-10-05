import mongoose, { model, Types } from 'mongoose';

const { Schema } = mongoose;

const CHAT_ROOM_TYPE = {
  group: 'group',
  personal: 'personal',
};

interface IChatRoom {
  chatRoomName: string;
  chatRoomAvatar: string;
  members: Types.Array<Types.ObjectId>;
  admin: Types.Array<Types.ObjectId>;
  type: string;
}

const chatRoomSchema = new Schema<IChatRoom>({
  chatRoomName: { type: String, required: false, default: null },
  chatRoomAvatar: { type: String, required: false, default: null },
  members: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  admin: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  type: [
    { type: String, enum: [CHAT_ROOM_TYPE.group, CHAT_ROOM_TYPE.personal] },
  ],
});

const ChatRoom = model<IChatRoom>('ChatRoom', chatRoomSchema);

export { IChatRoom, CHAT_ROOM_TYPE };
export default ChatRoom;
