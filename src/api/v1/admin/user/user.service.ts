import * as admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../../exception';
import User, { IUser } from '../../../../models/user';
import authService from '../../auth/auth.service';

const deleteUser = async (id: string) => {
  await User.findByIdAndDelete(id);
  await admin.auth().deleteUser(id);
};

const createUser = async (
  password: string,
  prefix: string,
  suffix: string,
  nums: number,
  photoUrl: string
) => {
  for (let i = 0; i < nums; i++) {
    const email = `${prefix}${i}@${suffix}`;
    console.log(email);
    const userRC = await createFirebaseUser(email, password, photoUrl);
    await authService.createUser(
      userRC.uid,
      userRC.photoURL,
      undefined,
      email,
      true
    );
  }
};

const createFirebaseUser = async (
  email: string,
  password: string,
  photoUrl: string
): Promise<UserRecord> => {
  return await admin.auth().createUser({
    email,
    password,
    photoURL: photoUrl,
  });
};

export default {
  deleteUser,
  createUser,
};
