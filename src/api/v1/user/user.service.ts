import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import User, { IUser } from '../../../models/user';
import isEmail from '../../../validator/is_email';
import isLink from '../../../validator/is_link';
import isPhone from '../../../validator/is_phone';

const validateUserProfile = (userInfo: IUser) => {
  const badRequestException = new HttpException(
    StatusCodes.BAD_REQUEST,
    'Bad request'
  );
  if (
    userInfo.isEmailVerified !== undefined &&
    userInfo.isEmailVerified !== null
  ) {
    throw badRequestException;
  }
  if (
    userInfo.isProfileFilled !== undefined &&
    userInfo.isProfileFilled !== null
  ) {
    throw badRequestException;
  }
  if (
    !isEmail(userInfo.email) ||
    !isLink(userInfo.avatar) ||
    !isPhone(userInfo.phone)
  ) {
    throw badRequestException;
  }
};

const updateUserProfile = async (
  uid: string,
  userInfo: IUser
): Promise<IUser> => {
  if (uid !== userInfo.uid) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid user id');
  }
  validateUserProfile(userInfo);
  userInfo.isProfileFilled = true; // set profile filled
  const user = await User.findOneAndUpdate({ uid }, userInfo);
  return user as IUser;
};

export default { updateUserProfile, validateUserProfile };
