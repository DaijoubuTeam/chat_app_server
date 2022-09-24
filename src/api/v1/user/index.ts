import { Router } from 'express';
import controller from './user.controller';
import authenticate from '../../../middleware/authenticate';

const router = Router();

router.get('/self', authenticate, controller.getSelfProfile);
router.get('/email-verified', controller.changeMailVerified);
router.patch('/self', authenticate, controller.putSelfProfile);
router.get('/verify-email', authenticate, controller.verifyEmail);
export default router;
