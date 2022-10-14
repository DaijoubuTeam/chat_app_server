import * as admin from 'firebase-admin';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../../exception';
import User, { IUser } from '../../../../models/user';

const deleteUser = async (id: string) => {
  await User.findByIdAndDelete(id);
  await admin.auth().deleteUser(id);
};

export default {
  deleteUser,
};
