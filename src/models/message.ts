import mongoose from 'mongoose';

const { Schema } = mongoose;

interface IMessage {
  chatId: string;
  from: string;
  timestamp: Date;
  content: string;
}
