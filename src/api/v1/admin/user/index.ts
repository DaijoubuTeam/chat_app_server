import { Router } from 'express';
import userController from './user.controller';

const router = Router();

router.post('/seed', userController.seedUser);
router.delete('/:id', userController.deleteUser);

export default router;
