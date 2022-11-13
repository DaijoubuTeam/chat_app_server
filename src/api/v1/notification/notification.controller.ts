import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import getRawNotification from '../../../common/getRawNotification';
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
    const notifications = await notificationService.getNotification(user._id);
    res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    next(error);
  }
};

const putToggleNotificationAsRead = async (
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
    await notificationService.putToggleNotificationAsRead(user._id, id);
    res.status(StatusCodes.OK).json({
      message: 'Toggle successful',
    });
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

export default {
  getNotifications,
  deleteNotification,
  putToggleNotificationAsRead,
};
