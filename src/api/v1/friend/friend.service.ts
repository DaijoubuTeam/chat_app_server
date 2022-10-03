import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import HttpException from '../../../exception';
import User, { IUser } from '../../../models/user';

const getFriendList = async (userId: string) => {
  const user: IUser | null = await User.findOne({ uid: userId })
    .populate(
      'friends',
      '-friends -friendRequests -_id -bans -isEmailVerified -isProfileFilled'
    )
    .exec();
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user.friends;
};

const addFriendRequestList = async (userId: string, friendId: string) => {
  const friend = await User.findOne({ uid: friendId });
  if (!friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (friend.bans.find((banId) => banId.toString() === userId)) {
    throw new HttpException(StatusCodes.CONFLICT, 'User has been banned');
  }
  if (friend.friendRequests.find((request) => request.toString() === userId))
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Request has been sent');
  friend.friendRequests.push(userId);
  return friend.save();
};

const removeFriend = async (userId: string, friendId: string) => {
  const user = await User.findOne({ uid: userId });
  const friend = await User.findOne({ uid: friendId });
  if (!user || !friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const friendIndex = user.friends.findIndex(
    (req) => req.toString() == friendId
  );
  if (friendIndex === -1)
    throw new HttpException(StatusCodes.BAD_REQUEST, 'User not be found');
  user.friends = new mongoose.Types.Array(
    ...user.friends.filter((friend) => friend.toString() === friendId)
  );
  friend.friends = new mongoose.Types.Array(
    ...friend.friends.filter((friend) => friend.toString() === userId)
  );
  return Promise.all([user.save(), friend.save()]);
};

const acceptRequest = async (userId: string, friendId: string) => {
  const user = await User.findOne({ uid: userId });
  const friend = await User.findOne({ uid: friendId });
  if (!user || !friend) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const friendRequestIndex = user.friendRequests.findIndex(
    (req) => req.toString() == friendId
  );
  if (friendRequestIndex === -1) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'Request not be found');
  }
  user.friendRequests = new mongoose.Types.Array(
    ...user.friendRequests.splice(friendRequestIndex, 1)
  );
  user.friends.push(friendId);
  friend.friends.push(userId);
  await Promise.all([user.save(), friend.save()]);
};

const deniedRequest = async (userId: string, friendId: string) => {
  const user = await User.findOne({ uid: userId });
  if (!user) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  const friendRequestIndex = user.friendRequests.findIndex(
    (req) => req.toString() == friendId
  );
  if (friendRequestIndex === -1) {
    throw new HttpException(StatusCodes.BAD_REQUEST, 'Request not be found');
  }
  user.friendRequests = new mongoose.Types.Array(
    ...user.friendRequests.splice(friendRequestIndex, 1)
  );
  await user.save();
};

const banUser = async (userId: string, bannedUserId: string) => {
  const user = await User.findOne({ uid: userId });
  const bannedUser = await User.findOne({ uid: bannedUserId });
  if (!user || !bannedUser) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (user.friends.find((friend) => friend.toString() === bannedUserId)) {
    throw new HttpException(StatusCodes.CONFLICT, 'User is friend');
  }
  bannedUser.friendRequests = new mongoose.Types.Array(
    ...bannedUser.friendRequests.filter(
      (request) => request.toString() === userId
    )
  );
  user.friendRequests = new mongoose.Types.Array(
    ...user.friendRequests.filter((request) => request.toString() === userId)
  );
  user.bans.push(bannedUserId);
  await Promise.all([user.save(), bannedUser.save()]);
};

const unbanUser = async (userId: string, bannedUserId: string) => {
  const user = await User.findOne({ uid: userId });
  const bannedUser = await User.findOne({ uid: bannedUserId });
  if (!user || !bannedUser) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (!user.bans.find((ban) => ban.toString() === bannedUserId)) {
    throw new HttpException(StatusCodes.NOT_FOUND, 'User has not been banned');
  }

  user.bans = new mongoose.Types.Array(
    ...user.bans.filter((ban) => ban.toString() === bannedUserId)
  );

  await user.save();
};

export default {
  getFriendList,
  addFriendRequestList,
  removeFriend,
  acceptRequest,
  deniedRequest,
  banUser,
  unbanUser,
};
