import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import getRawUser from '../../../common/getRawUser';
import HttpException from '../../../exception';
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

export default {
  searchUsers,
  filterUserFriend,
};
