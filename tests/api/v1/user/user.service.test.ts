import { IUser } from '../../../../src/models/user';
import userService from '../../../../src/api/v1/user/user.service';
import HttpException from '../../../../src/exception';

describe('user.service', function () {
  describe('validateUserProfile', function () {
    let userInfo: IUser;
    beforeEach(() => {
      userInfo = {
        email: 'test@mail.com',
        uid: 'mock-uid',
        phone: '0905030201',
        avatar: 'https://daijoubuteam.com',
      } as IUser;
    });
    test('should throw HttpExeception if userInfo has isEmailVerified', function () {
      userInfo.isEmailVerified = true;

      expect(() => userService.validateUserProfile(userInfo)).toThrow(
        HttpException
      );

      userInfo.isEmailVerified = false;
      expect(() => userService.validateUserProfile(userInfo)).toThrow(
        HttpException
      );
    });
    test('should throw HttpExeception if userInfo has isEmailVerified', function () {
      userInfo.isProfileFilled = true;

      expect(() => userService.validateUserProfile(userInfo)).toThrow(
        HttpException
      );

      userInfo.isProfileFilled = false;
      expect(() => userService.validateUserProfile(userInfo)).toThrow(
        HttpException
      );
    });
    test('should throw HttpException if email is invalid', function () {
      userInfo.email = 'invalid_email';
      expect(() => userService.validateUserProfile(userInfo)).toThrow(
        HttpException
      );
    });
    test('should throw HttpException if avatar is invalid', function () {
      userInfo.avatar = 'invalid_link';
      expect(() => userService.validateUserProfile(userInfo)).toThrow(
        HttpException
      );
    });
    test('should throw HttpException if phone is invalid', function () {
      userInfo.avatar = '1905150biet';
      expect(() => userService.validateUserProfile(userInfo)).toThrow(
        HttpException
      );
    });

    test('should not throw HttpException if all is valid', function () {
      expect(() => userService.validateUserProfile(userInfo)).not.toThrow(
        HttpException
      );
    });
  });
  describe('updateUserProfile', function () {
    let userInfo: IUser;

    beforeEach(() => {
      userInfo = {
        email: 'test@mail.com',
        uid: 'mock-uid',
        phone: '0905030201',
        avatar: 'https://daijoubuteam.com',
      } as IUser;
    });

    test('should throw HttpExeption if uid not equal userInfo.uid', async function () {
      const mockUid_1 = 'mock-uid-1';
      const mockUid_2 = 'mock-uid-2';

      userInfo.uid = mockUid_1;
      try {
        await userService.updateUserProfile(mockUid_2, userInfo);
        fail('should not successful');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
      }
    });
  });
});
