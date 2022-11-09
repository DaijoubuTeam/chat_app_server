import { Router } from 'express';
import chatRoomController from './chatroom.controller';
import isGroupAdmin from './middleware/isGroupAdmin';

const router = Router();

router.get('/', chatRoomController.getUserChatRooms); // Get all user's chat room
router.post('/', chatRoomController.postNewChatRoom); // Create a new group chat room

router.get('/:chatRoomId/accept', chatRoomController.acceptJoinChatRoom); // Accept to join chat room
router.get('/:chatRoomId/reject', chatRoomController.rejectJoinChatRoom); // Reject to join chat room
router.post(
  '/:chatRoomId/:memberId',
  isGroupAdmin,
  chatRoomController.sendChatRoomRequest
); // Add member to group chat room
router.delete(
  '/:chatRoomId/:memberId',
  isGroupAdmin,
  chatRoomController.deleteRemoveMember
); // Remove member from group chat room

router.get('/chat-room-requests', chatRoomController.getChatRoomRequests);

router.put('/:chatRoomId', isGroupAdmin, chatRoomController.putChatRoom); //Update group chat room
router.delete('/:chatRoomId', isGroupAdmin, chatRoomController.deleteChatRoom); // Delete group chat room

export default router;
