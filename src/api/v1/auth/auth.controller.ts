import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import service from './auth.service';

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
        decodedToken.email_verified
      );
      return res.status(StatusCodes.CREATED).json({
        user: {
          ...service.getRawUser(newUser),
        },
      });
    }
    return res.status(StatusCodes.OK).json({
      user: {
        ...service.getRawUser(user),
      },
    });
  } catch (exception) {
    next(exception);
  }
};

const forgotPassword = async (
  req: Request<any, any, { email: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    await service.sendResetPasswordCode(email);
    res.status(StatusCodes.ACCEPTED).json('Send email successful');
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (
  req: Request<
    { userId: string },
    any,
    { password: string },
    { token: string }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password } = req.body;
    const { token } = req.query;
    const { userId } = req.params;
    await service.verifyResetPasswordToken(userId, token);
    await service.updatePassword(userId, password);
    res.status(StatusCodes.OK).json('Update successful');
  } catch (error) {
    next(error);
  }
};

export default { verifyUser, forgotPassword, resetPassword };
