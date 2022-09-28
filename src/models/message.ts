import mongoose from 'mongoose';

const { Schema } = mongoose;

interface IMessage {
  chatId: string;
  from: mongoose.Types.ObjectId;
  timestamp: Date;
  content: string;
}
