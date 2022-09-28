import mongoose, { Types } from 'mongoose';

const { Schema } = mongoose;

interface IChatRoom {
  chatRoomName: string;
  members: Types.Array<Types.ObjectId>;
}

// const chatRoomSchema = new Schema<IChatRoom>({
//   chatRoomName: { type: String, required: false, default: null },
//   members: {type: }
// });
