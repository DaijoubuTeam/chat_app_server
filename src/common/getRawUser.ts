import { IUser } from '../models/user';

const getRawUser = (user: IUser) => {
  const rawUser = {
    gender: user.gender,
    fullname: user.fullname,
    uid: user._id,
    avatar: user.avatar,
    phone: user.phone,
    about: user.about,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    isProfileFilled: user.isProfileFilled,
  };
  return rawUser;
};
export default getRawUser;
