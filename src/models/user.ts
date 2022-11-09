import mongoose, { model } from 'mongoose';

const { Schema } = mongoose;

interface IUser {
  gender: string;
  fullname: string;
  _id: string;
  avatar: string;
  phone: string;
  about: string;
  email: string;
  isEmailVerified?: boolean;
  isProfileFilled?: boolean;
  friends: mongoose.Types.Array<string>;
  friendRequests: mongoose.Types.Array<string>;
  friendRequestsSent: mongoose.Types.Array<string>;
  chatRoomRequests: mongoose.Types.Array<mongoose.Types.ObjectId>;
  bans: mongoose.Types.Array<string>;
  chatRooms: mongoose.Types.Array<mongoose.Types.ObjectId>;
}

const userSchema = new Schema<IUser>(
  {
    gender: { type: String, default: '' },
    fullname: { type: String, default: '' },
    _id: { type: String },
    avatar: { type: String },
    phone: { type: String, default: '' },
    about: { type: String, default: '' },
    email: { type: String, default: '' },
    isEmailVerified: { required: true, type: Boolean, default: false },
    isProfileFilled: { required: true, type: Boolean, default: false },
    friends: [{ type: String, ref: 'User' }],
    friendRequests: [{ type: String, ref: 'User' }],
    friendRequestsSent: [{ type: String, ref: 'User' }],
    bans: [{ type: String, ref: 'User' }],
    chatRoomRequests: [{ type: mongoose.Types.ObjectId, ref: 'ChatRoom' }],
    chatRooms: [{ type: mongoose.Types.ObjectId, ref: 'ChatRoom' }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual('uid').get(function (this: IUser) {
  return this._id;
});

const User = model<IUser>('User', userSchema);

export { IUser };

export default User;
