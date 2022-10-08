import { it, expect, describe, vi, beforeEach } from 'vitest';
import authService from './auth.service';
import { Request } from 'express';
import { AuthException } from '../../../exception/auth_exception';
import { StatusCodes } from 'http-status-codes';
import User, { IUser } from '../../../models/user';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import ResetPasswordToken, {
  IResetPasswordToken,
} from '../../../models/reset_password_token';
import mongoose from 'mongoose';
import HttpException from '../../../exception';
import ejs from 'ejs';
import sendEmail from '../../../common/sendEmail';

const firebaseVerify = vi.fn();
const firebaseUpdateUser = vi.fn();

vi.mock('firebase-admin', () => {
  return {
    default: {
      auth: () => {
        return {
          verifyIdToken: firebaseVerify,
          updateUser: firebaseUpdateUser,
        };
      },
    },
  };
});

vi.mock('mongoose');
vi.mock('ejs');
vi.mock('../../../common/sendEmail');

const mockUserSave = vi.fn();

vi.mock('../../../models/user', () => {
  return {
    default: function () {
      return {
        save: mockUserSave,
      };
    },
  };
});

const mockUserFindById = vi.fn();
const mockUserFindOne = vi.fn();
User.findById = mockUserFindById;
User.findOne = mockUserFindOne;

const mockResetPasswordTokenSave = vi.fn();

vi.mock('../../../models/reset_password_token', () => {
  return {
    default: function () {
      return {
        save: mockResetPasswordTokenSave,
      };
    },
  };
});

const mockResetPasswordTokenFindById = vi.fn();
const mockResetPasswordTokenDeleteMany = vi.fn();
ResetPasswordToken.findById = mockResetPasswordTokenFindById;
ResetPasswordToken.deleteMany = mockResetPasswordTokenDeleteMany;

describe('getHeaderToken()', () => {
  it('should return a token if header is correctly set', () => {
    const mockToken = 'Token';
    const authorizationHeader = `Bearer ${mockToken}`;
    const req = {
      headers: {
        authorization: authorizationHeader,
      },
    } as Request;

    const result = authService.getHeaderToken(req);

    expect(result).toBe(mockToken);
  });

  it('should throw new AuthException with not found status code if request does not have authorization Header', () => {
    const req = { headers: {} } as Request;
    const resultFn = () => authService.getHeaderToken(req);
    expect(resultFn).toThrow(
      new AuthException(StatusCodes.NOT_FOUND, 'Token not found')
    );
  });

  it('should throw new AuthException with not found status code if Authorization Header do not have the right format', () => {
    const invalidHeader = 'invalid-header';

    const req = { headers: { authorization: invalidHeader } } as Request;
    const resultFn = () => authService.getHeaderToken(req);
    expect(resultFn).toThrow(
      new AuthException(StatusCodes.NOT_FOUND, 'Token not found')
    );
  });
});

describe('verifyToken()', () => {
  it('should throw new AuthException if token can not be verified ', () => {
    firebaseVerify.mockImplementation(() => {
      throw new Error();
    });
    const mockToken = 'token';

    const resultFn = authService.verifyToken(mockToken);
    return expect(resultFn).rejects.toThrowError(
      new AuthException(StatusCodes.BAD_REQUEST, 'Invalid token')
    );
  });

  it('should return decoded token if token verirable', () => {
    const token = 'token';
    const decodedToken = 'decoded-token';
    firebaseVerify.mockImplementation(() => {
      return decodedToken;
    });
    const result = authService.verifyToken(token);
    return expect(result).resolves.toBe(decodedToken);
  });
});

describe('getUser()', () => {
  it('should return user if user found', async () => {
    const mockUid = 'mock-uid';
    const user = {
      _id: mockUid,
    } as IUser;

    const decodedIdToken = {
      uid: mockUid,
    } as DecodedIdToken;

    vi.mocked(mockUserFindById).mockResolvedValueOnce(user);

    const result = await authService.getUser(decodedIdToken);

    expect(result).toBe(user);
  });
  it('should return null if cant not find user', async () => {
    const mockUid = 'mock-uid';
    const decodedIdToken = {
      uid: mockUid,
    } as DecodedIdToken;

    vi.mocked(mockUserFindById).mockResolvedValueOnce(undefined);

    const result = await authService.getUser(decodedIdToken);

    expect(result).toBeNull();
  });
  it('should return null if User.findById throw Error', async () => {
    const mockUid = 'mock-uid';
    const decodedIdToken = {
      uid: mockUid,
    } as DecodedIdToken;

    vi.mocked(mockUserFindById).mockRejectedValueOnce(new Error());

    const result = await authService.getUser(decodedIdToken);

    expect(result).toBeNull();
  });
});

describe('createUser()', () => {
  it('should create user if pass validation', async () => {
    const uid_1 = 'uid-1';
    const avatar_1 = 'https://example.com/a.jpg';
    const phone_1 = '09080705033';
    const email_1 = 'example@domain.vn';
    const isEmailVerified_1 = true;
    await authService.createUser(
      uid_1,
      avatar_1,
      phone_1,
      email_1,
      isEmailVerified_1
    );
    expect(mockUserSave).toBeCalledTimes(1);
    mockUserSave.mockClear();
    const uid_2 = 'uid-1';
    await authService.createUser(
      uid_2,
      undefined,
      undefined,
      undefined,
      undefined
    );
    expect(mockUserSave).toBeCalledTimes(1);
    mockUserSave.mockClear();
  });
  it('should throw HttpException if invalid avatar provided', () => {
    const uid_1 = 'uid-1';
    const avatar_1 = 'invalid-avatar';
    const phone_1 = '09080705033';
    const email_1 = 'example@domain.vn';
    const isEmailVerified_1 = true;
    const result = authService.createUser(
      uid_1,
      avatar_1,
      phone_1,
      email_1,
      isEmailVerified_1
    );
    return expect(result).rejects.toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Invalid avatar')
    );
  });
  it('should throw HttpException if invalid phone provided', () => {
    const uid_1 = 'uid-1';
    const avatar_1 = 'https://example.com/a.jpg';
    const phone_1 = '090807s05033';
    const email_1 = 'example@domain.vn';
    const isEmailVerified_1 = true;
    const result = authService.createUser(
      uid_1,
      avatar_1,
      phone_1,
      email_1,
      isEmailVerified_1
    );
    return expect(result).rejects.toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Invalid phone number')
    );
  });
  it('should throw HttpException if invalid email address provided', () => {
    const uid_1 = 'uid-1';
    const avatar_1 = 'https://example.com/a.jpg';
    const phone_1 = '09080705033';
    const email_1 = 'exampledomain.vn';
    const isEmailVerified_1 = true;
    const result = authService.createUser(
      uid_1,
      avatar_1,
      phone_1,
      email_1,
      isEmailVerified_1
    );
    return expect(result).rejects.toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Invalid email address')
    );
  });
});

describe('getResetLink()', () => {
  it('should throw HttpException if there is no CLIENT_RESET_URL', () => {
    const OLD_CLIENT_RESET_URL = process.env.CLIENT_RESET_URL;

    process.env = { ...process.env, CLIENT_RESET_URL: undefined };

    const fakeIdToken = {} as IResetPasswordToken & {
      _id: mongoose.Types.ObjectId;
    };
    const resultFn = () => authService.getResetLink(fakeIdToken);
    expect(resultFn).toThrow(
      new HttpException(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error'
      )
    );
    process.env = { ...process.env, CLIENT_RESET_URL: OLD_CLIENT_RESET_URL };
  });
  it('should return a link with predefined format', () => {
    const OLD_CLIENT_RESET_URL = process.env.CLIENT_RESET_URL;

    const mockClientUrl = 'https://test.com/';

    process.env = { ...process.env, CLIENT_RESET_URL: mockClientUrl };
    const mockId = new mongoose.Types.ObjectId();

    const fakeIdToken = { _id: mockId } as IResetPasswordToken & {
      _id: mongoose.Types.ObjectId;
    };

    const result = authService.getResetLink(fakeIdToken);
    expect(result).toBe(`${mockClientUrl}?token=${fakeIdToken._id}`);
    process.env = { ...process.env, CLIENT_RESET_URL: OLD_CLIENT_RESET_URL };
  });
});

describe('sendEmailResetLink()', () => {
  beforeEach(() => {
    vi.mocked(sendEmail).mockClear();
    vi.mocked(ejs.renderFile).mockClear();
  });
  it('should call ejs.renderFile Once', async () => {
    const mockId = new mongoose.Types.ObjectId();
    const mockToken = { _id: mockId } as IResetPasswordToken & {
      _id: mongoose.Types.ObjectId;
    };
    const mockEmail = 'test@example.com';
    const reset_link = authService.getResetLink(mockToken);
    await authService.sendEmailResetLink(mockEmail, mockToken);
    expect(vi.mocked(ejs.renderFile)).toBeCalledTimes(1);
    expect(vi.mocked(ejs.renderFile).mock.calls[0][1]).toEqual({ reset_link });
  });
  it('should call sendEmail Once', async () => {
    const mockId = new mongoose.Types.ObjectId();
    const mockToken = { _id: mockId } as IResetPasswordToken & {
      _id: mongoose.Types.ObjectId;
    };
    const mockEmail = 'test@example.com';
    const mockTemplate = 'mock-template';

    vi.mocked(ejs.renderFile).mockResolvedValueOnce(mockTemplate);

    await authService.sendEmailResetLink(mockEmail, mockToken);
    expect(vi.mocked(sendEmail).mock.calls.length).toBe(1);
    expect(vi.mocked(sendEmail).mock.calls[0][0]).toBe(mockEmail);
    expect(vi.mocked(sendEmail).mock.calls[0][1]).toBe('Reset password');
    expect(vi.mocked(sendEmail).mock.calls[0][2]).toBe(mockTemplate);
  });
});

describe('sendResetPasswordMail()', () => {
  it('should throw a HttpException if user not found', () => {
    mockUserFindOne.mockResolvedValueOnce(null);
    const result = authService.sendResetPasswordMail('mock-email');
    return expect(result).rejects.toThrow(
      new HttpException(StatusCodes.NOT_FOUND, 'User not found')
    );
  });
  it('should save an reset password token in database', async () => {
    const mockId = 'mock-id';
    const mockEmail = 'test@example.com';
    const mockUser = { _id: mockId } as IUser;
    const mockObjectId = new mongoose.Types.ObjectId();
    const mockIdResetPasswordToken = {
      _id: mockObjectId,
    } as IResetPasswordToken & { _id: mongoose.Types.ObjectId };

    const mockSendEmailResetLink = vi.fn();

    mockUserFindOne.mockResolvedValueOnce(mockUser);
    mockResetPasswordTokenSave.mockResolvedValueOnce(mockIdResetPasswordToken);
    await authService.sendResetPasswordMail(mockEmail, mockSendEmailResetLink);
    expect(mockResetPasswordTokenSave.mock.calls.length).toBe(1);
    expect(mockSendEmailResetLink.mock.calls.length).toBe(1);
    expect(mockSendEmailResetLink.mock.calls[0][0]).toBe(mockEmail);
    expect(mockSendEmailResetLink.mock.calls[0][1]).toBe(
      mockIdResetPasswordToken
    );
  });
});
describe('verifyResetPasswordToken', () => {
  it('should throw HttpException if reset password token not found', async () => {
    mockResetPasswordTokenFindById.mockResolvedValueOnce(null);
    const resultFn = authService.verifyResetPasswordToken('test');
    return expect(resultFn).rejects.toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Invalid reset code')
    );
  });
  it('should return reset token uid if vaid token provided', async () => {
    const mockUid = 'mock-uid';
    const mockResetToken = { uid: mockUid } as IResetPasswordToken;
    mockResetPasswordTokenFindById.mockResolvedValueOnce(mockResetToken);
    const result = await authService.verifyResetPasswordToken('');
    expect(result).toBe(mockUid);
  });
});
describe('verifyResetPasswordToken', () => {
  it('should throw HttpException if reset password token not found', async () => {
    mockResetPasswordTokenFindById.mockResolvedValueOnce(null);
    const resultFn = authService.verifyResetPasswordToken('test');
    return expect(resultFn).rejects.toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Invalid reset code')
    );
  });
  it('should return reset token uid if vaid token provided', async () => {
    const mockUid = 'mock-uid';
    const mockResetToken = { uid: mockUid } as IResetPasswordToken;
    mockResetPasswordTokenFindById.mockResolvedValueOnce(mockResetToken);
    const result = await authService.verifyResetPasswordToken('');
    expect(result).toBe(mockUid);
  });
});

describe('updatePassword', () => {
  beforeEach(() => {
    firebaseUpdateUser.mockClear();
    mockResetPasswordTokenDeleteMany.mockClear();
  });
  it('should call firebase.auth().updateUser once', async () => {
    const mockUserId = 'mock-user-id';
    const mockPassword = 'mock-password';
    await authService.updatePassword(mockUserId, mockPassword);
    expect(firebaseUpdateUser.mock.calls.length).toBe(1);
    expect(firebaseUpdateUser.mock.calls[0][0]).toBe(mockUserId);
    expect(firebaseUpdateUser.mock.calls[0][1]).toStrictEqual({
      password: mockPassword,
    });
  });
  it('should call ResetPasswordToken.deleteMany once', async () => {
    const mockUserId = 'mock-user-id';
    const mockPassword = 'mock-password';
    await authService.updatePassword(mockUserId, mockPassword);
    expect(mockResetPasswordTokenDeleteMany.mock.calls.length).toBe(1);
    expect(mockResetPasswordTokenDeleteMany.mock.calls[0][0]).toStrictEqual({
      uid: mockUserId,
    });
  });
});
