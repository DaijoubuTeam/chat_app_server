import { Router } from 'express';
import controller from './auth.controller';

const router = Router();

router.post('/verify', controller.verifyUser);
router.post('/forgot-password', controller.forgotPassword);

export default router;
