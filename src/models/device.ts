import mongoose, { model } from 'mongoose';

interface IDevice {
  _id: string;
  name: string;
  uid?: string;
  token?: string;
}

const deviceSchema = new mongoose.Schema<IDevice>(
  {
    _id: { type: String },
    name: { type: String },
    uid: { type: String, ref: 'User', default: null },
    token: { type: String, default: null },
  },
  { expires: '2M' }
);

const Device = model<IDevice>('Device', deviceSchema);

export { IDevice };

export default Device;
