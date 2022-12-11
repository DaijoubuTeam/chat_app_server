import { Router } from 'express';
import controller from './webrtc.controller';

const router = Router();

router.post('/:id', controller.sendToSocketUser);
export default router;
