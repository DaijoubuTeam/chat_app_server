import ejs from 'ejs';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import sendEmail from '../../../common/sendEmail';
import HttpException from '../../../exception';
import User, { IUser } from '../../../models/user';
import isEmail from '../../../validator/is_email';
import isLink from '../../../validator/is_link';
import isPhone from '../../../validator/is_phone';
import dotenv from 'dotenv';
import firebase, { auth } from 'firebase-admin';
import { ActionCodeSettings } from 'firebase-admin/lib/auth/action-code-settings-builder';
import VerifyEmailToken from '../../../models/verify_email_token';
import crypto from 'crypto';
import { toLowerCaseNonAccentVietnamese } from '../../../common/vietnamese/non-accent';
import sendSocketToUser from '../../../common/sendSocketToUser';
import constants from '../../../constants';

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
    badRequestException.message = 'IsEmailVerified is not allowed';
    throw badRequestException;
  }

  if (
    userInfo.isProfileFilled !== undefined &&
    userInfo.isProfileFilled !== null
  ) {
    badRequestException.message = 'isProfileFilled is not allowed';
    throw badRequestException;
  }

  if (userInfo.email !== undefined && userInfo.email !== null) {
    badRequestException.message = 'email is not allowed';
    throw badRequestException;
  }

  if (!isLink(userInfo.avatar) || !isPhone(userInfo.phone)) {
    badRequestException.message = 'invalid link or phone number';
    throw badRequestException;
  }
};

const updateUserProfile = async (
  _id: string,
  userInfo: IUser,
  _validateUserProfile = validateUserProfile
): Promise<IUser> => {
  userInfo._id = _id;
  _validateUserProfile(userInfo);
  userInfo.isProfileFilled = true; // set profile filled
  await User.findByIdAndUpdate(_id, userInfo);
  const user = await User.findById(_id);
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

  // const actionCodeSettings: ActionCodeSettings = {
  //   url,
  //   handleCodeInApp: true,
  //   iOS: {
  //     bundleId: 'xyz.daijoubuteam.chatapp',
  //   },
  //   android: {
  //     packageName: 'xyz.daijoubuteam.chatapp',
  //     installApp: true,
  //     minimumVersion: '12',
  //   },
  //   dynamicLinkDomain: 'chatapp.daijoubuteam.xyz',
  // };
  // const link = await firebase
  //   .auth()
  //   .generateEmailVerificationLink(email, actionCodeSettings);
  return url;
};

const sendVerifyEmailMail = async (
  email: string,
  _getVerifiedLink = getVerifiedLink,
  _loadVerifyEmailTemplate = loadVerifyEmailTemplate,
  _sendEmail = sendEmail
) => {
  if (!isEmail(email)) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'User email is not valid');
  }
  const veriyEmailToken = new VerifyEmailToken({
    email,
    token: crypto.randomBytes(8).toString('hex'),
  });
  await veriyEmailToken.save();
  const link = await _getVerifiedLink(email, veriyEmailToken.token);
  const template = await _loadVerifyEmailTemplate(link);
  await _sendEmail(email, 'Verify your email', template);
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
  await sendSocketToUser(user._id, constants.socketEvents.EMAIL_VERIFIED, {});
  await user.save();
  await existingVerifiedEmailToken.delete();
  await auth().updateUser(user._id, {
    emailVerified: true,
  });
};

const searchUser = async (searchString?: string): Promise<IUser> => {
  if (!searchString) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Search string not found');
  }
  const user = await User.findOne({
    $or: [{ email: searchString }, { phone: searchString }],
  });
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
};

const isFriend = async (user_1: string, user_2: string) => {
  try {
    const user = await User.findOne({
      _id: user_1,
      friends: {
        $in: [user_2],
      },
    });
    if (!user) {
      throw new Error();
    }
    return true;
  } catch (error) {
    return false;
  }
};

const getUserById = async (userId: string) => {
  return User.findById(userId);
};

export default {
  updateUserProfile,
  validateUserProfile,
  sendVerifyEmailMail,
  changeEmailVerified,
  loadVerifyEmailTemplate,
  getVerifiedLink,
  searchUser,
  isFriend,
  getUserById,
};
