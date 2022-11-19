import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import service from './auth.service';
import getRawUser from '../../../common/getRawUser';

const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = service.getHeaderToken(req);
    const decodedToken = await service.verifyToken(token);
    const user = await service.getUser(decodedToken);

    if (!user) {
      const newUser = await service.createUser(
        decodedToken.uid,
        decodedToken.picture,
        decodedToken.phone_number,
        decodedToken.email,
        decodedToken.email_verified,
        undefined
      );
      return res.status(StatusCodes.CREATED).json({
        user: {
          ...getRawUser(newUser),
        },
      });
    }
    return res.status(StatusCodes.OK).json({
      user: {
        ...getRawUser(user),
      },
    });
  } catch (exception) {
    next(exception);
  }
};

const forgotPassword = async (
  req: Request<unknown, unknown, { email: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    await service.sendResetPasswordMail(email);
    res.status(StatusCodes.ACCEPTED).json('Send email successful');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (
  req: Request<unknown, unknown, { password: string }, { token: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;
    const { token } = req.query;
    const userId = await service.verifyResetPasswordToken(token);
    await service.updatePassword(userId, password);
    res.status(StatusCodes.OK).json('Update successful');
  } catch (error) {
    next(error);
  }
};

export default { verifyUser, forgotPassword, resetPassword };
