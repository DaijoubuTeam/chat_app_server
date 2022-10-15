import { Router } from 'express';
import messageController from './message.controller';

const router = Router();

router.post('/chat-room/:chatRoomId', messageController.postSendMessage);

export default router;
