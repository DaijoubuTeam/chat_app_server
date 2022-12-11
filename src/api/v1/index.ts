import { Router } from 'express';
import authRouter from './auth';
import userRouter from './user';
import friendRouter from './friend';
import authenticate from '../../middleware/authenticate';
import chatRoomRouter from './chatroom';
import adminRouter from './admin';
import dotenv from 'dotenv';
import messageRouter from './message';
import notificationRouter from './notification';
import searchRouter from './search';
import deviceRouter from './device';
import webrtcRouter from './webrtc';

dotenv.config();

const router = Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/friend', authenticate, friendRouter);
router.use('/chat-room', authenticate, chatRoomRouter);
router.use('/message', authenticate, messageRouter);
router.use('/notification', authenticate, notificationRouter);
router.use('/search', authenticate, searchRouter);
router.use('/device', authenticate, deviceRouter);
router.use('/webrtc', authenticate, webrtcRouter);

if (process.env.ENVIRONMENT === 'DEV') {
  router.use('/admin', adminRouter);
}

export default router;
