import { Router } from 'express';
import controller from './notification.controller';

const router = Router();

router.get('/', controller.getNotifications);
router.delete('/:id', controller.deleteNotification);

export default router;
