import { Router } from 'express';
import controller from './notification.controller';

const router = Router();

router.get('/', controller.getNotifications);
router.delete('/:id', controller.deleteNotification);
router.put('/:id', controller.putNotification);

export default router;
