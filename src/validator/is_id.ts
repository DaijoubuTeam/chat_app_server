import mongoose from 'mongoose';

function isUserId(id: string): boolean {
  return true;
}

function isObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export default {
  isUserId,
  isObjectId,
};
