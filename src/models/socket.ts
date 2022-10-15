import mongoose, { model } from 'mongoose';

interface ISocketUser {
  _id: string;
  uid: string;
}

const socketUserSchema = new mongoose.Schema<ISocketUser>({
  _id: { type: String },
  uid: { type: String, ref: 'User' },
});

const SocketUser = model<ISocketUser>('SocketUser', socketUserSchema);

export { ISocketUser };

export default SocketUser;
