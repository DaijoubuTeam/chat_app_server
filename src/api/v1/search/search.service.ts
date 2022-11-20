import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import getRawChatRoom from '../../../common/getRawChatRoom';
import getRawUser from '../../../common/getRawUser';
import HttpException from '../../../exception';
import ChatRoom from '../../../models/chat_room';
import User from '../../../models/user';

const searchUsers = async (
  query: string,
  friendIds: string[]
): Promise<string[]> => {
  const elasticSearchUrl = process.env.ELASTIC_SEARCH_URL;
  const elasticSearchUserUrl = process.env.ELASTIC_SEARCH_USER_URL;
  if (!elasticSearchUrl || !elasticSearchUserUrl) {
    throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Env not found');
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
};

const filterUserFriend = async (userIds: string[]) => {
  const users = await User.find({ _id: { $in: userIds } });
  return users.map((user) => getRawUser(user));
};

const searchChatRoom = async (
  query: string,
  userId: string
): Promise<mongoose.Types.ObjectId[]> => {
  const elasticSearchUrl = process.env.ELASTIC_SEARCH_URL;
  const elasticSearchChatRoomUrl = process.env.ELASTIC_SEARCH_CHATROOM_URL;
  if (!elasticSearchUrl || !elasticSearchChatRoomUrl) {
    throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Env not found');
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
    console.log(data.query.bool);
    return rs.data['hits']['hits']
      .map((hit: { _id: string }) => hit['_id'])
      .map((id: string) => new mongoose.Types.ObjectId(id));
  }
  return [];
};

const filterChatRoom = async (chatRoomIds: mongoose.Types.ObjectId[]) => {
  console.log(chatRoomIds);
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

export default {
  searchUsers,
  filterUserFriend,
  searchChatRoom,
  filterChatRoom,
};
