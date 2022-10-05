import { Router } from 'express';
import authRouter from './auth';
import userRouter from './user';
import friendRouter from './friend';
import authenticate from '../../middleware/authenticate';
import chatRoomRouter from './chatroom';

const router = Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/friend', authenticate, friendRouter);
router.use('/chat-room', authenticate, chatRoomRouter);

export default router;
