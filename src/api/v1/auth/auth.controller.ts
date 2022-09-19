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

export default { verifyUser };
