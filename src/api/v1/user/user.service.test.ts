import { StatusCodes } from 'http-status-codes';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HttpException from '../../../exception';
import User, { IUser } from '../../../models/user';
import userService from './user.service';
import ejs from 'ejs';
import VerifyEmailToken from '../../../models/verify_email_token';

vi.mock('ejs');

const mockVerifyEmailTokenSave = vi.fn();
const mockVerifyEmailTokenDelete = vi.fn();
vi.mock('../../../models/verify_email_token', () => {
  return {
    default: function () {
      return {
        save: mockVerifyEmailTokenSave,
        delete: mockVerifyEmailTokenDelete,
      };
    },
  };
});

const mockVerifyEmailTokenFindOne = vi.fn();
VerifyEmailToken.findOne = mockVerifyEmailTokenFindOne;

const mockFirebaseAuthGenerateEmailVerificationLink = vi.fn();
vi.mock('firebase-admin', () => {
  return {
    default: {
      auth: function () {
        return {
          generateEmailVerificationLink:
            mockFirebaseAuthGenerateEmailVerificationLink,
        };
      },
    },
  };
});

const mockUserFindByIdAndUpdate = vi.fn();
const mockUserFindById = vi.fn();
const mockUserFindOne = vi.fn();

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
User.findByIdAndUpdate = mockUserFindByIdAndUpdate;
User.findById = mockUserFindById;
User.findOne = mockUserFindOne;

describe('validateUserProfile()', () => {
  it('should throw HttpException if args have isEmailVerified field', () => {
    const user = { isEmailVerified: true } as IUser;
    const resultFn = () => userService.validateUserProfile(user);
    expect(resultFn).toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Bad request')
    );
  });
  it('should throw HttpException if args have isProfileFilled field', () => {
    const user = { isProfileFilled: true } as IUser;
    const resultFn = () => userService.validateUserProfile(user);
    expect(resultFn).toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Bad request')
    );
  });
  it('should throw HttpException if args have email field', () => {
    const user = { email: 'test@test.com' } as IUser;
    const resultFn = () => userService.validateUserProfile(user);
    expect(resultFn).toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Bad request')
    );
  });
  it('should throw HttpException if args have invalid avatar field', () => {
    const user = { avatar: 'invalid-link', phone: '' } as IUser;
    const resultFn = () => userService.validateUserProfile(user);
    expect(resultFn).toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Bad request')
    );
  });
  it('should throw HttpException if args have invalid phone field', () => {
    const user = { phone: 'invalid-phone', avatar: '' } as IUser;
    const resultFn = () => userService.validateUserProfile(user);
    expect(resultFn).toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'Bad request')
    );
  });
  it('should not throw HttpException if args is valid', () => {
    const user = {
      phone: '090807065',
      avatar: 'https://localhost.com/a.jpg',
    } as IUser;
    const resultFn = () => userService.validateUserProfile(user);
    expect(resultFn).not.toThrow();
  });
});
describe('updateUserProfile()', () => {
  beforeEach(() => {
    mockUserFindById.mockClear();
    mockUserFindByIdAndUpdate.mockClear();
  });
  it('should call vadiateUserProfile Once', async () => {
    const validateUserProfile = vi.fn();
    const userInfo = {} as IUser;
    const _id = 'mock-id';

    await userService.updateUserProfile(_id, userInfo, validateUserProfile);
    expect(validateUserProfile.mock.calls.length).toBe(1);
    expect(validateUserProfile.mock.calls[0][0]).toBe(userInfo);
  });
  it('should call User.findByIdAndUpdate Once', async () => {
    const validateUserProfile = vi.fn();
    const userInfo = {} as IUser;
    const _id = 'mock-id';

    await userService.updateUserProfile(_id, userInfo, validateUserProfile);
    expect(mockUserFindByIdAndUpdate.mock.calls.length).toBe(1);
    expect(mockUserFindByIdAndUpdate.mock.calls[0][0]).toBe(_id);
    expect(mockUserFindByIdAndUpdate.mock.calls[0][1]).toBe(userInfo);
  });
  it('should call User.findById Once', async () => {
    const validateUserProfile = vi.fn();
    const userInfo = {} as IUser;
    const _id = 'mock-id';

    await userService.updateUserProfile(_id, userInfo, validateUserProfile);
    expect(mockUserFindById.mock.calls.length).toBe(1);
    expect(mockUserFindById.mock.calls[0][0]).toBe(_id);
  });
});
describe('loadVerifyEmailTemplate()', () => {
  it('should call ejs.renderFile once', async () => {
    const mockLink = 'test link';
    await userService.loadVerifyEmailTemplate(mockLink);
    expect(vi.mocked(ejs.renderFile).mock.calls.length).toBe(1);
    expect(vi.mocked(ejs.renderFile).mock.calls[0][1]).toStrictEqual({
      link: mockLink,
    });
  });
});
describe('getVerifiedLink()', () => {
  it('should yield a HttpException if no HOST env provided', () => {
    const OLD_ENV = { ...process.env };
    process.env = { ...process.env, HOST: undefined };
    const mockEmai = 'email@mock.com';
    const mockToken = 'mock-token';
    const result = userService.getVerifiedLink(mockEmai, mockToken);
    expect(result).rejects.toThrow(
      new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'HOST env missing')
    );
    process.env = { ...OLD_ENV };
    return;
  });
  it('should call firebase.auth().generateEmailVerificationLink once', async () => {
    const mockEmai = 'email@mock.com';
    const mockToken = 'mock-token';
    const mockLink = 'mock-link';
    mockFirebaseAuthGenerateEmailVerificationLink.mockResolvedValueOnce(
      mockLink
    );
    const result = await userService.getVerifiedLink(mockEmai, mockToken);
    expect(result).toBe(mockLink);
    expect(
      mockFirebaseAuthGenerateEmailVerificationLink.mock.calls.length
    ).toBe(1);
  });
});
describe('sendVerifyEmailMail()', () => {
  it('should throw HttpException if invalid email provided', () => {
    const invalidEmail = 'invalid-email';
    const mockGetVerifiedLink = vi.fn();
    const mockLoadVerifyEmailTemplate = vi.fn();
    const mockSendEmail = vi.fn();
    const result = userService.sendVerifyEmailMail(
      invalidEmail,
      mockGetVerifiedLink,
      mockLoadVerifyEmailTemplate,
      mockSendEmail
    );
    expect(result).rejects.toThrow(
      new HttpException(StatusCodes.BAD_REQUEST, 'User email is not valid')
    );
  });
  it('should call VerifyEmailToken.save once if valid email provided', async () => {
    const mockEmail = 'test@example.com';
    const mockGetVerifiedLink = vi.fn();
    const mockLoadVerifyEmailTemplate = vi.fn();
    const mockSendEmail = vi.fn();
    await userService.sendVerifyEmailMail(
      mockEmail,
      mockGetVerifiedLink,
      mockLoadVerifyEmailTemplate,
      mockSendEmail
    );
    expect(mockVerifyEmailTokenSave.mock.calls.length).toBe(1);
  });
  it('should call getVerifiedLink once if valid email provided', async () => {
    const mockEmail = 'test@example.com';
    const mockGetVerifiedLink = vi.fn();
    const mockLoadVerifyEmailTemplate = vi.fn();
    const mockSendEmail = vi.fn();
    await userService.sendVerifyEmailMail(
      mockEmail,
      mockGetVerifiedLink,
      mockLoadVerifyEmailTemplate,
      mockSendEmail
    );
    expect(mockGetVerifiedLink.mock.calls.length).toBe(1);
    expect(mockGetVerifiedLink.mock.calls[0][0]).toBe(mockEmail);
  });
  it('should call loadVerifyEmailTemplate once if valid email provided', async () => {
    const mockEmail = 'test@example.com';
    const mockLink = 'mockLink';
    const mockGetVerifiedLink = vi.fn();
    const mockLoadVerifyEmailTemplate = vi.fn();
    const mockSendEmail = vi.fn();

    mockGetVerifiedLink.mockResolvedValueOnce(mockLink);

    await userService.sendVerifyEmailMail(
      mockEmail,
      mockGetVerifiedLink,
      mockLoadVerifyEmailTemplate,
      mockSendEmail
    );
    expect(mockLoadVerifyEmailTemplate.mock.calls.length).toBe(1);
    expect(mockLoadVerifyEmailTemplate.mock.calls[0][0]).toBe(mockLink);
  });
  it('should call sendEmail once if valid email provided', async () => {
    const mockEmail = 'test@example.com';
    const mockLink = 'mockLink';
    const mockTemplate = 'mock-template';
    const mockGetVerifiedLink = vi.fn();
    const mockLoadVerifyEmailTemplate = vi.fn();
    const mockSendEmail = vi.fn();

    mockGetVerifiedLink.mockResolvedValueOnce(mockLink);
    mockLoadVerifyEmailTemplate.mockResolvedValueOnce(mockTemplate);
    await userService.sendVerifyEmailMail(
      mockEmail,
      mockGetVerifiedLink,
      mockLoadVerifyEmailTemplate,
      mockSendEmail
    );
    expect(mockSendEmail.mock.calls.length).toBe(1);
    expect(mockSendEmail.mock.calls[0][0]).toBe(mockEmail);
    expect(mockSendEmail.mock.calls[0][1]).toBe('Verify your email');

    expect(mockSendEmail.mock.calls[0][2]).toBe(mockTemplate);
  });
});
describe('changeEmailVerified()', () => {
  it('should throw HttpException if verifiedEmailToken not found', () => {
    const mockToken = 'mock-token';
    mockVerifyEmailTokenFindOne.mockResolvedValueOnce(null);
    const result = userService.changeEmailVerified(mockToken);
    expect(result).rejects.toThrow(
      new HttpException(StatusCodes.NOT_FOUND, 'Token not found')
    );
  });
  it('should throw HttpException if user not found', () => {
    const mockToken = 'mock-token';
    const mockEmail = 'mockEmail';
    mockVerifyEmailTokenFindOne.mockResolvedValueOnce({ email: mockEmail });
    mockUserFindOne.mockResolvedValueOnce(null);
    const result = userService.changeEmailVerified(mockToken);
    expect(result).rejects.toThrow(
      new HttpException(StatusCodes.NOT_FOUND, 'User not found')
    );
  });
  it('should call user.save once', async () => {
    const mockToken = 'mock-token';
    const mockEmail = 'mockEmail';
    const mockSave = vi.fn();
    const mockDelete = vi.fn();
    mockVerifyEmailTokenFindOne.mockResolvedValueOnce({
      email: mockEmail,
      delete: mockDelete,
    });
    mockUserFindOne.mockResolvedValueOnce({ save: mockSave });
    await userService.changeEmailVerified(mockToken);
    expect(mockSave.mock.calls.length).toBe(1);
  });
  it('should call verifyEmailToken.delete once', async () => {
    const mockToken = 'mock-token';
    const mockEmail = 'mockEmail';
    const mockSave = vi.fn();
    const mockDelete = vi.fn();
    mockVerifyEmailTokenFindOne.mockResolvedValueOnce({
      email: mockEmail,
      delete: mockDelete,
    });
    mockUserFindOne.mockResolvedValueOnce({ save: mockSave });
    await userService.changeEmailVerified(mockToken);
    expect(mockDelete.mock.calls.length).toBe(1);
  });
});
