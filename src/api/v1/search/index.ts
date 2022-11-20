import { Router } from 'express';
import controller from './search.controller';

const router = Router();

router.get('/user', controller.searchUser);
router.get('/chatroom', controller.searchChatRoom);
router.get('/message', controller.searchMessage);
router.get('/', controller.search);
export default router;
