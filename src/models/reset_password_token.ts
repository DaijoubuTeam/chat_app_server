import mongoose, { model } from 'mongoose';

interface IResetPasswordToken {
  uid: string;
  token: string;
  expireAt: Date;
}

const resetPasswordTokenSchema = new mongoose.Schema<IResetPasswordToken>({
  uid: { type: String, required: true },
  token: { type: String, required: true },
  expireAt: { type: Date, default: Date.now, index: { expires: '10m' } },
});

const ResetPasswordToken = model<IResetPasswordToken>(
  'ResetPasswordToken',
  resetPasswordTokenSchema
);

export { IResetPasswordToken };

export default ResetPasswordToken;
