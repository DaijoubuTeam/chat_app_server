import { IChatRoom } from '../models/chat_room';

const getRawChatRoom = (chatroom: IChatRoom) => {
  const rawChatRoom = {
    chatRoomName: chatroom.chatRoomName,
    chatRoomAvatar: chatroom.chatRoomAvatar,
    members: chatroom.members,
    admin: chatroom.admin,
    type: chatroom.type,
    chatRoomId: chatroom._id,
  };
  return rawChatRoom;
};
export default getRawChatRoom;
