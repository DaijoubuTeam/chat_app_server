import { it, expect } from 'vitest';
import ChatRoom, { IChatRoom } from '../models/chat_room';
import getRawChatRoom from './getRawChatRoom';

it('should return an object with predefined property', () => {
  const chatRoomName = 'chat-room-name';
  const chatRoomAvatar = 'chat-room-avatar';
  const members = ['mem1', 'mem2'];
  const admin = ['admin1', 'admin2'];
  const type = 'mock-type';
  const chatRoomId = 'id';
  const chatRoom = {
    chatRoomName,
    chatRoomAvatar,
    members,
    admin,
    type,
    _id: chatRoomId,
  } as unknown as IChatRoom;

  const result = getRawChatRoom(chatRoom);

  expect(result.chatRoomName).toBe(chatRoomName);
  expect(result.chatRoomAvatar).toBe(chatRoomAvatar);
  expect(result.members).toBe(members);
  expect(result.admin).toBe(admin);
  expect(result.type).toBe(type);
  expect(result.chatRoomId).toBe(chatRoomId);
});
