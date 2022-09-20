import { Router } from 'express';
import controller from './user.controller';
import authenticate from '../../../middleware/authenticate';

const router = Router();

router.get('/self', authenticate, controller.getSelfProfile);
export default router;
