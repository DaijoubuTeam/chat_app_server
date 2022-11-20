import * as admin from 'firebase-admin';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../../exception';
import User, { IUser } from '../../../../models/user';
import authService from '../../auth/auth.service';
import names from './name.json';

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
    console.log('CREATED');
    const email = `${prefix}${i}@${suffix}`;
    const userRC = await createFirebaseUser(email, password, photoUrl);
    await authService.createUser(
      userRC.uid,
      userRC.photoURL,
      undefined,
      email,
      true,
      getRandomName()
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

const getRandomName = () => {
  const index = Math.floor(Math.random() * names.length);
  return names[index].name;
};

export default {
  deleteUser,
  createUser,
};
