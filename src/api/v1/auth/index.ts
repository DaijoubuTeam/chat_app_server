import { Router } from 'express';
import controller from './auth.controller';

const router = Router();

router.get('/verify', controller.verifyUser);
router.post('/forgot-password', controller.forgotPassword);
// router.patch('/reset-password', controller.resetPassword);

export default router;
