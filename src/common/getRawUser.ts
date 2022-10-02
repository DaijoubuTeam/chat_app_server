import { IUser } from '../models/user';

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

export default getRawUser;
