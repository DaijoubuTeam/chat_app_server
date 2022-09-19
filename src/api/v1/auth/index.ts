import { Router } from 'express';
import controller from './auth.controller';

const router = Router();

router.post('/verify', controller.verifyUser);

export default router;
