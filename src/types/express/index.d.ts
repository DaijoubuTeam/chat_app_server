import { IUser } from '../../models/user';

// export {};

// declare global {
//   namespace Express {
//     export interface Request {
//       user?: IUser;
//     }
//   }
// }

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}
