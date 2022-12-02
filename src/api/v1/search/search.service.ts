import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import getRawChatRoom from '../../../common/getRawChatRoom';
import getRawMessage from '../../../common/getRawMessage';
import getRawUser from '../../../common/getRawUser';
import HttpException from '../../../exception';
import ChatRoom, { CHAT_ROOM_TYPE, IChatRoom } from '../../../models/chat_room';
import Message from '../../../models/message';
import User, { IUser } from '../../../models/user';

const searchUsers = async (
  query: string,
  friendIds: string[]
): Promise<string[]> => {
  try {
    const elasticSearchUrl = process.env.ELASTIC_SEARCH_URL;
    const elasticSearchUserUrl = process.env.ELASTIC_SEARCH_USER_URL;
    if (!elasticSearchUrl || !elasticSearchUserUrl) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Env not found'
      );
    }
    const searchUrl = elasticSearchUrl + elasticSearchUserUrl;

    const rs = await axios.post(searchUrl, {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['fullname', 'email', 'phone'],
                fuzziness: 'AUTO',
              },
            },
            {
              ids: {
                values: friendIds,
              },
            },
          ],
        },
      },
    });
    if (rs.status == StatusCodes.OK) {
      return rs.data['hits']['hits'].map((hit: { _id: string }) => hit['_id']);
    }
    return [];
  } catch (error) {
    return [];
  }
};

const filterUserFriend = async (userIds: string[]) => {
  const users = await User.find({ _id: { $in: userIds } });
  return users.map((user) => getRawUser(user));
};

const searchChatRoom = async (
  query: string,
  userId: string
): Promise<mongoose.Types.ObjectId[]> => {
  try {
    const elasticSearchUrl = process.env.ELASTIC_SEARCH_URL;
    const elasticSearchChatRoomUrl = process.env.ELASTIC_SEARCH_CHATROOM_URL;
    if (!elasticSearchUrl || !elasticSearchChatRoomUrl) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Env not found'
      );
    }
    const searchUrl = elasticSearchUrl + elasticSearchChatRoomUrl;

    const data = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['chatRoomName'],
                fuzziness: 'AUTO',
              },
            },
            {
              match: {
                members: userId,
              },
            },
          ],
        },
      },
    };
    const rs = await axios.post(searchUrl, data);
    if (rs.status == StatusCodes.OK) {
      return rs.data['hits']['hits']
        .map((hit: { _id: string }) => hit['_id'])
        .map((id: string) => new mongoose.Types.ObjectId(id));
    }
    return [];
  } catch (error) {
    return [];
  }
};

const filterChatRoom = async (chatRoomIds: mongoose.Types.ObjectId[]) => {
  const chatRooms = await ChatRoom.find({ _id: { $in: chatRoomIds } })
    .populate({
      path: 'latestMessage',
      populate: {
        path: 'from readed',
      },
    })
    .populate({
      path: 'members',
    });
  return chatRooms.map((chatRoom) => getRawChatRoom(chatRoom));
};

const searchMessages = async (
  query: string,
  chatRoomIds: string[]
): Promise<mongoose.Types.ObjectId[]> => {
  try {
    const elasticSearchUrl = process.env.ELASTIC_SEARCH_URL;
    const elasticSearchMessageUrl = process.env.ELASTIC_SEARCH_MESSAGE_URL;
    if (!elasticSearchUrl || !elasticSearchMessageUrl) {
      throw new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Env not found'
      );
    }
    const searchUrl = elasticSearchUrl + elasticSearchMessageUrl;

    const data = {
      query: {
        bool: {
          must: [
            {
              match: {
                content: {
                  query: query,
                },
              },
            },
            {
              terms: {
                chatRoomId: chatRoomIds,
              },
            },
          ],
        },
      },
    };
    const rs = await axios.post(searchUrl, data);
    if (rs.status == StatusCodes.OK) {
      return rs.data['hits']['hits']
        .map((hit: { _id: string }) => hit['_id'])
        .map((id: string) => new mongoose.Types.ObjectId(id));
    }
    return [];
  } catch (error) {
    return [];
  }
};

const filterMessage = async (
  messageIds: mongoose.Types.ObjectId[],
  userId: string
) => {
  const messages = await Message.find({ _id: { $in: messageIds } })
    .populate({
      path: 'from readed',
    })
    .populate({
      path: 'chatRoomId',
      populate: {
        path: 'members',
      },
    });
  return messages
    .map((message) => getRawMessage(message))
    .map((message) => {
      if (message.chatRoom != undefined) {
        if ((message.chatRoom as IChatRoom).type === CHAT_ROOM_TYPE.personal) {
          const friend = (message.chatRoom as IChatRoom).members.find(
            (member) => {
              return (member as any).uid !== userId;
            }
          ) as unknown as IUser;
          (message.chatRoom as IChatRoom).chatRoomAvatar = friend.avatar;
          (message.chatRoom as IChatRoom).chatRoomName = friend.fullname;
          console.log(message);
        }
      }
      return message;
    });
};

export default {
  searchUsers,
  filterUserFriend,
  searchChatRoom,
  filterChatRoom,
  searchMessages,
  filterMessage,
};
