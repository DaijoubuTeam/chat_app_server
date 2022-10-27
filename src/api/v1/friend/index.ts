import { Router } from 'express';
import controller from './friend.controller';

const router = Router();

router.get('/', controller.getUserFriends); // Get friends list
router.get('/friend-requests', controller.getFriendRequest);
router.post('/', controller.sendFriendRequest); // Send friend request
router.delete('/:id', controller.deleteFriend); // Remove friend (unfriend)
router.get('/:id', controller.acceptOrDeniedFriendRequest); // Accept or denied friend request or bans friend based on query

export default router;
