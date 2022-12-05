import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import getRawDevice from '../../../common/getRawDevice';
import HttpException from '../../../exception';
import { IDevice } from '../../../models/device';
import service from './device.service';

const getDeviceList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const devicesList = await service.getDevicesList(user._id);
    res.status(StatusCodes.OK).json(devicesList);
  } catch (error) {
    next(error);
  }
};

const postDevice = async (
  req: Request<
    any,
    any,
    {
      token: string;
      deviceId: string;
      name: string;
    }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { deviceId, token, name } = req.body;
    if (!deviceId || !token) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'Invalid body');
    }
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const device = await service.addToDevice(user._id, deviceId, token, name);
    res.status(StatusCodes.CREATED).json(device);
  } catch (error) {
    next(error);
  }
};

const deleteDevice = async (
  req: Request<{ deviceId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    const { deviceId } = req.params;
    if (!user) {
      throw new HttpException(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const devicesList = await service.removeDevice(deviceId);
    res.status(StatusCodes.OK).json(devicesList);
  } catch (error) {
    next(error);
  }
};

export default {
  getDeviceList,
  postDevice,
  deleteDevice,
};
