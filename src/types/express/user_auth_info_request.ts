import { IUser } from '../../models/user';

import { Request } from 'express';
export interface UserAuthInfoRequest extends Request {
  user?: IUser;
}
