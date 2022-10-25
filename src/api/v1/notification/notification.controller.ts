import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import HttpException from '../../../exception';
import notificationService from './notification.service';

const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const notification = await notificationService.getNotification(user._id);
    res.status(StatusCodes.OK).json(notification);
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const { id } = req.params;
    await notificationService.removeNotification(user._id, id);
    res.status(StatusCodes.OK).json({
      message: 'Delete successful',
    });
  } catch (error) {
    next(error);
  }
};

const putNotification = async (
  req: Request<{ id: string }, unknown, unknown, { readed: boolean }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const { id } = req.params;
    const { readed } = req.query;
    await notificationService.updateNotification(user._id, id, readed);
    res.status(StatusCodes.OK).json({
      message: 'Delete successful',
    });
  } catch (error) {
    next(error);
  }
};

export default { getNotifications, deleteNotification, putNotification };
