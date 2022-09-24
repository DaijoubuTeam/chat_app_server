import mongoose, { model } from 'mongoose';

interface IVerifyEmailToken {
  email: string;
  token: string;
  expireAt: Date;
}

const verifyEmailTokenSchema = new mongoose.Schema<IVerifyEmailToken>({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expireAt: { type: Date, default: Date.now, index: { expires: '10m' } },
});

const VerifyEmailToken = model<IVerifyEmailToken>(
  'VerifyEmailToken',
  verifyEmailTokenSchema
);

export { IVerifyEmailToken };

export default VerifyEmailToken;
