import { Request } from 'express';
import authService from '../../../../src/api/v1/auth/auth.service';
import { AuthException } from '../../../../src/exception/auth_exception';
import * as admin from 'firebase-admin';
import { Auth } from 'firebase-admin/lib/auth/auth';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import User from '../../../../src/models/user';

jest.mock('../../../../src/models/user');
const mockedAdmin = jest.mocked(admin);
const mockedUser = jest.mocked(User);

describe('auth.service', function () {
  describe('getHeaderToken', function () {
    test('should return token if the authorization header is valid', function () {
      const mock_token = 'mock_token';
      const mockRequest = {
        headers: {
          authorization: `Bearer ${mock_token}`,
        },
      } as Request;

      expect(authService.getHeaderToken(mockRequest)).toEqual(mock_token);
    });
    test('should throw exception if the authorization header is invalid', function () {
      const mock_token = 'mock_token';
      const mockRequest = {
        headers: {
          authorization: `Bearer${mock_token}`,
        },
      } as Request;

      expect(() => authService.getHeaderToken(mockRequest)).toThrow(
        AuthException
      );
    });

    it('should throw exception if authorization header is empty', function () {
      const mockRequest = {
        headers: {
          authorization: '',
        },
      } as Request;

      expect(() => authService.getHeaderToken(mockRequest)).toThrow(
        AuthException
      );
    });
  });
  describe('verifyToken', function () {
    test('should throw exception if firebase.auth().verifyIdToken rejected', async function () {
      try {
        mockedAdmin.initializeApp.mockImplementationOnce(jest.fn());
        mockedAdmin.auth.mockImplementation(() => {
          return {
            verifyIdToken: async function () {
              throw new Error('mock-error');
            },
          } as unknown as Auth;
        });
        await authService.verifyToken('');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('should return decodedToken if firebase.auth().verifyIdToken fullfilled', async function () {
      try {
        const mockedDecodedToken = new Object() as DecodedIdToken;
        mockedAdmin.initializeApp.mockImplementationOnce(jest.fn());
        mockedAdmin.auth.mockImplementation(() => {
          return {
            verifyIdToken: async function () {
              return mockedDecodedToken;
            },
          } as unknown as Auth;
        });
        const token = await authService.verifyToken('');
        expect(token).toBe(mockedDecodedToken);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
  describe('getUser', function () {
    test('should return user if user exists', async function () {
      const mockUid = 'mock-uid';
      const mockUser = new User({ uid: mockUid });
      const mockDecodedToken = {
        uid: mockUid,
      } as unknown as DecodedIdToken;
      mockedUser.findOne.mockResolvedValueOnce(mockUser);
      const user = await authService.getUser(mockDecodedToken);
      expect(user).toBe(mockUser);
    });

    test('should return null if user not exist', async function () {
      const mockUid = 'mock-uid';
      const mockDecodedToken = {
        uid: mockUid,
      } as unknown as DecodedIdToken;
      mockedUser.findOne.mockResolvedValueOnce(null);
      const user = await authService.getUser(mockDecodedToken);
      expect(user).toBeNull();
    });

    test('should return null if can not query', async function () {
      const mockUid = 'mock-uid';
      const mockError = 'mock-error';
      const mockDecodedToken = {
        uid: mockUid,
      } as unknown as DecodedIdToken;
      mockedUser.findOne.mockRejectedValueOnce(mockError);
      const user = await authService.getUser(mockDecodedToken);
      expect(user).toBeNull();
    });
  });
});
