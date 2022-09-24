import ejs from 'ejs';
import { NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import sendEmail from '../../../common/sendEmail';
import HttpException from '../../../exception';
import User, { IUser } from '../../../models/user';
import isEmail from '../../../validator/is_email';
import isLink from '../../../validator/is_link';
import isPhone from '../../../validator/is_phone';
import dotenv from 'dotenv';
import { auth } from 'firebase-admin';
import { ActionCodeSettings } from 'firebase-admin/lib/auth/action-code-settings-builder';
import VerifyEmailToken from '../../../models/verify_email_token';
import crypto from 'crypto';

dotenv.config();

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

const loadVerifyEmailTemplate = async (link: string): Promise<string> => {
  const templatePath = path.join(
    __dirname,
    'template',
    'verify_email_template.ejs'
  );
  const template = await ejs.renderFile(templatePath, {
    link,
  });
  return template;
};

const getVerifiedLink = async (
  email: string,
  token: string
): Promise<string> => {
  const hostUrl = process.env.HOST;

  if (!hostUrl) {
    throw new HttpException(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'HOST env missing'
    );
  }

  const url = `${hostUrl}/api/v1/user/email-verified?token=${token}`;

  const actionCodeSettings: ActionCodeSettings = {
    url,
    handleCodeInApp: true,
    iOS: {
      bundleId: 'xyz.daijoubuteam.chatapp',
    },
    android: {
      packageName: 'xyz.daijoubuteam.chatapp',
      installApp: true,
      minimumVersion: '12',
    },
    dynamicLinkDomain: 'chatapp.daijoubuteam.xyz',
  };
  const link = await auth().generateEmailVerificationLink(
    email,
    actionCodeSettings
  );
  return link;
};

const sendVerifyEmailMail = async (email: string) => {
  if (!isEmail(email)) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'User email is not valid');
  }
  const veriyEmailToken = new VerifyEmailToken({
    email,
    token: crypto.randomBytes(8).toString('hex'),
  });
  await veriyEmailToken.save();
  const link = await getVerifiedLink(email, veriyEmailToken.token);
  const template = await loadVerifyEmailTemplate(link);
  await sendEmail(email, 'Verify your email', template);
};

const changeEmailVerified = async (token: string) => {
  const existingVerifiedEmailToken = await VerifyEmailToken.findOne({ token });
  if (!existingVerifiedEmailToken) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Token not found');
  }
  const user = await User.findOne({ email: existingVerifiedEmailToken.email });
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  user.isEmailVerified = true;
  await user.save();
  await existingVerifiedEmailToken.delete();
};

export default {
  updateUserProfile,
  validateUserProfile,
  sendVerifyEmailMail,
  changeEmailVerified,
};
