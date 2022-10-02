import mongoose, { model } from 'mongoose';

const { Schema } = mongoose;

interface IUser {
  username: string;
  fullname: string;
  uid: string;
  avatar: string;
  phone: string;
  about: string;
  email: string;
  isEmailVerified?: boolean;
  isProfileFilled?: boolean;
  friends: mongoose.Types.Array<mongoose.Types.ObjectId>;
  friendRequests: mongoose.Types.Array<mongoose.Types.ObjectId>;
  bans: mongoose.Types.Array<mongoose.Types.ObjectId>;
}

const userSchema = new Schema<IUser>({
  username: { type: String, default: '' },
  fullname: { type: String, default: '' },
  uid: { required: true, type: String, default: '', index: true },
  avatar: { type: String },
  phone: { type: String, default: '' },
  about: { type: String, default: '' },
  email: { type: String, default: '' },
  isEmailVerified: { required: true, type: Boolean, default: false },
  isProfileFilled: { required: true, type: Boolean, default: false },
  friends: [{ type: this, ref: 'User' }],
  friendRequests: [{ type: this, ref: 'User' }],
  bans: [{ type: this, ref: 'User' }],
});

const User = model<IUser>('User', userSchema);

export { IUser };

export default User;
