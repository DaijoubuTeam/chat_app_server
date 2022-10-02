import { Router } from 'express';
import authRouter from './auth';
import userRouter from './user';
import friendRouter from './friend';
import authenticate from '../../middleware/authenticate';

const router = Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/friend', authenticate, friendRouter);

export default router;
