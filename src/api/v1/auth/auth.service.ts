import { Request } from 'express';
import firebase, { auth } from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { AuthException } from '../../../exception/auth_exception';
import User from '../../../models/user';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import ResetPasswordToken, {
  IResetPasswordToken,
} from '../../../models/reset_password_token';
import ejs from 'ejs';
import path from 'path';
import sendEmail from '../../../common/sendEmail';
import mongoose from 'mongoose';
import isLink from '../../../validator/is_link';
import isPhone from '../../../validator/is_phone';
import isEmail from '../../../validator/is_email';

const getHeaderToken = (req: Request) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.split(' ')[1]) {
    throw new AuthException(StatusCodes.NOT_FOUND, 'Token not found');
  }
  const token = authorizationHeader.split(' ')[1];
  return token;
};

const verifyToken = async (token: string) => {
  try {
    const decodedToken = await firebase.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new AuthException(StatusCodes.BAD_REQUEST, 'Invalid token');
  }
};

const getUser = async (decodedToken: DecodedIdToken) => {
  try {
    const user = await User.findById(decodedToken.uid);
    if (!user) {
      throw new AuthException(StatusCodes.NOT_FOUND, 'User not found');
    }
    return user;
  } catch (error) {
    return null;
  }
};

const createUser = async (
  uid: string,
  avatar: string | undefined,
  phone: string | undefined,
  email: string | undefined,
  isEmailVerified: boolean | undefined,
  fullname: string | undefined
) => {
  if (!avatar) {
    avatar = process.env.EMPTY_USER_AVATAR;
  }
  if (phone === undefined) {
    phone = '';
  }
  if (email === undefined) {
    email = '';
  }
  if (isEmailVerified === undefined) {
    isEmailVerified = false;
  }
  if (fullname === undefined) {
    fullname = '';
  }
  if (!isLink(avatar ?? '')) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid avatar');
  }
  if (!isPhone(phone)) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid phone number');
  }
  if (!isEmail(email)) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid email address');
  }
  const user = new User({
    _id: uid,
    avatar,
    phone,
    email,
    isEmailVerified,
    fullname,
  });
  return user.save();
};

// #region Reset password

const getResetLink = async (email: string) => {
  const reset_link = await auth().generatePasswordResetLink(email);

  return reset_link;
};

const sendEmailResetLink = async (email: string) => {
  const templatePath = path.join(
    __dirname,
    'template',
    'reset_password_template.ejs'
  );

  const reset_link = await getResetLink(email);

  const template = await ejs.renderFile(templatePath, {
    reset_link,
  });
  await sendEmail(email, 'Reset password', template);
};

const sendResetPasswordMail = async (
  email: string,
  _sendEmailResetLink = sendEmailResetLink
) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (!user.isEmailVerified) {
    throw new HttpException(StatusCodes.FORBIDDEN, 'Email has not verified');
  }
  await _sendEmailResetLink(email);
};

// const verifyResetPasswordToken = async (token: string) => {
//   const resetToken = await ResetPasswordToken.findById(token);
//   if (!resetToken) {
//     throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid reset code');
//   }
//   return resetToken.uid;
// };

// const updatePassword = async (userId: string, password: string) => {
//   await firebase.auth().updateUser(userId, {
//     password,
//   });
//   await ResetPasswordToken.deleteMany({ uid: userId });
// };
// #endregion

export default {
  getResetLink,
  getHeaderToken,
  getUser,
  verifyToken,
  createUser,
  sendResetPasswordMail,
  // verifyResetPasswordToken,
  // updatePassword,
  sendEmailResetLink,
};
