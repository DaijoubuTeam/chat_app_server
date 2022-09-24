import { Request } from 'express';
import firebase from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { AuthException } from '../../../exception/auth_exception';
import User, { IUser } from '../../../models/user';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import ResetPasswordToken from '../../../models/reset_password_token';
import sgMail from '@sendgrid/mail';
import ejs from 'ejs';
import path from 'path';
import sendEmail from '../../../common/sendEmail';

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
    const user = await User.findOne({ uid: decodedToken.uid });
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
  isEmailVerified: boolean | undefined
) => {
  const user = new User({ uid, avatar, phone, email, isEmailVerified });
  return user.save();
};

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

const generateResetCode = () => {
  return (Math.random() * 10000 * 1000).toString().substring(0, 4);
};

const sendEmailResetCode = async (email: string, reset_code: string) => {
  const templatePath = path.join(
    __dirname,
    'template',
    'reset_password_template.ejs'
  );
  const template = await ejs.renderFile(templatePath, {
    reset_code,
  });
  await sendEmail(email, 'Reset password', template);
};

const sendResetPasswordCode = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const token = generateResetCode();
  const resetPasswordToken = new ResetPasswordToken({
    uid: user.uid,
    token,
  });
  await resetPasswordToken.save();
  await sendEmailResetCode(email, token);
};

const verifyResetPasswordToken = async (token: string) => {
  const resetToken = await ResetPasswordToken.findOne({
    token: token,
  });
  if (!resetToken) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid reset code');
  }
  return resetToken.uid;
};

const updatePassword = async (userId: string, password: string) => {
  await firebase.auth().updateUser(userId, {
    password,
  });
  await ResetPasswordToken.deleteMany({ uid: userId });
};

export default {
  getHeaderToken,
  getUser,
  verifyToken,
  createUser,
  getRawUser,
  sendResetPasswordCode,
  generateResetCode,
  verifyResetPasswordToken,
  updatePassword,
};
