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
  isEmailVerified: boolean;
  isProfileFilled: boolean;
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
});

const User = model<IUser>('User', userSchema);

const getRawUser = (user: IUser) => {
  const rawUser = {
    username: user.username,
    fullname: user.fullname,
    uid: user.uid,
    avatar: user.avatar,
    phone: user.phone,
    about: user.about,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    isProfileFilled: user.isProfileFilled,
  };
  return rawUser;
};

export { IUser, getRawUser };

export default User;
