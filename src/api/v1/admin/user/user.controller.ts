import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import userService from './user.service';

const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
};

const seedUser = async (
  req: Request<
    unknown,
    unknown,
    {
      password: string;
      prefix: string;
      nums: number;
      suffix: string;
      photo: string;
    }
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { password, prefix, nums, suffix, photo } = req.body;
    await userService.createUser(password, prefix, suffix, nums, photo);

    res.status(StatusCodes.OK).json('Seed successful');
  } catch (error) {
    next(error);
  }
};
export default { deleteUser, seedUser };
