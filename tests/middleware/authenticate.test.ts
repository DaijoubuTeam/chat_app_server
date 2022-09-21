import { NextFunction, Request, Response } from 'express';
import { AuthException } from '../../src/exception/auth_exception';
import authenticate from '../../src/middleware/authenticate';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import User from '../../src/models/user';

jest.mock('firebase-admin');

const mockedAdmin = jest.mocked(admin);
const mockedUser = jest.mocked(User);

describe('authenticate', function () {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNextFunction: NextFunction & jest.Mock;

  test('Next function should be called once with AuthException if there is no authorization header', async function () {
    mockRequest = {
      headers: {
        authorization: undefined,
      },
    } as Request;
    mockResponse = {} as Response;
    mockNextFunction = jest.fn();
    await authenticate(mockRequest, mockResponse, mockNextFunction);

    expect(mockNextFunction.mock.calls[0][0]).toBeInstanceOf(AuthException);
    expect(mockNextFunction.mock.calls.length).toEqual(1);
    expect(mockRequest.user).toBeFalsy();
  });

  test('Next function should be called once with AuthException if there is no valid authorization header', async function () {
    mockRequest = {
      headers: {
        authorization: 'invalid-header',
      },
    } as Request;
    mockResponse = {} as Response;
    mockNextFunction = jest.fn();

    await authenticate(mockRequest, mockResponse, mockNextFunction);

    expect(mockNextFunction.mock.calls[0][0]).toBeInstanceOf(AuthException);
    expect(mockNextFunction.mock.calls.length).toEqual(1);
    expect(mockRequest.user).toBeFalsy();
  });

  test('Next function should be called once if can not verify Id Token', async function () {
    const mockBearerToken = 'Bearer mock-token';
    mockRequest = {
      headers: {
        authorization: mockBearerToken,
      },
    } as Request;
    mockResponse = {} as Response;
    mockNextFunction = jest.fn();
    const mockError = new Error('mock-error');
    const mockAuth = {
      verifyIdToken: async function () {
        throw mockError;
      },
    } as unknown as admin.auth.Auth;
    mockedAdmin.initializeApp = jest.fn();
    mockedAdmin.initializeApp.mockImplementationOnce(jest.fn());
    mockedAdmin.auth = jest.fn();
    mockedAdmin.auth.mockImplementationOnce(() => {
      return mockAuth;
    });

    await authenticate(mockRequest, mockResponse, mockNextFunction);
    expect(mockNextFunction.mock.calls[0][0]).toBe(mockError);
    expect(mockNextFunction.mock.calls.length).toBe(1);
    expect(mockRequest.user).toBeFalsy();
  });

  test('Next function should be called with AuthException if there is no user in database', async function () {
    const mockBearerToken = 'Bearer mock-token';
    mockRequest = {
      headers: {
        authorization: mockBearerToken,
      },
    } as Request;
    mockResponse = {} as Response;
    mockNextFunction = jest.fn();
    const mockUid = 'mock-uid';
    const mockAuth = {
      verifyIdToken: async function () {
        return { mockUid } as Partial<DecodedIdToken>;
      },
    } as unknown as admin.auth.Auth;
    mockedAdmin.initializeApp.mockImplementationOnce(jest.fn());
    mockedAdmin.auth = jest.fn();
    mockedAdmin.auth.mockImplementationOnce(() => {
      return mockAuth;
    });

    mockedUser.findOne = jest.fn();
    mockedUser.findOne.mockResolvedValueOnce(null);
    await authenticate(mockRequest, mockResponse, mockNextFunction);
    expect(mockNextFunction.mock.calls.length).toBe(1);
    expect(mockNextFunction.mock.calls[0][0]).toBeInstanceOf(AuthException);
    expect(mockRequest.user).toBeFalsy();
  });

  test('Request should have user if there is no exception occur', async function () {
    const mockBearerToken = 'Bearer mock-token';
    mockRequest = {
      headers: {
        authorization: mockBearerToken,
      },
    } as Request;
    mockResponse = {} as Response;
    mockNextFunction = jest.fn();
    const mockUid = 'mock-uid';
    const mockAuth = {
      verifyIdToken: async function () {
        return { mockUid } as Partial<DecodedIdToken>;
      },
    } as unknown as admin.auth.Auth;
    mockedAdmin.initializeApp.mockImplementationOnce(jest.fn());
    mockedAdmin.auth = jest.fn();
    mockedAdmin.auth.mockImplementationOnce(() => {
      return mockAuth;
    });

    const mockUser = new User();

    mockedUser.findOne = jest.fn();
    mockedUser.findOne.mockResolvedValueOnce(mockUser);
    await authenticate(mockRequest, mockResponse, mockNextFunction);
    expect(mockRequest.user).toBe(mockUser);
    expect(mockNextFunction.mock.calls.length).toBe(0);
  });
});
