import { Router } from 'express';
import messageController from './message.controller';

const router = Router();

router.get('/:messageId', messageController.getMessagesById);
router.post('/chat-room/:chatRoomId', messageController.postSendMessage);
router.get('/chat-room/:chatRoomId', messageController.getMessages);

export default router;
