import { AuthenticateUser } from '@/use-cases/AuthenticateUser';
import { AuthService } from '@/domain/Auth';
import { ApiError } from '@/domain/Errors';

describe('AuthenticateUser', () => {
  let authService: jest.Mocked<AuthService>;
  let authenticateUser: AuthenticateUser;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      getCurrentUser: jest.fn(),
      selectTenant: jest.fn(),
      acceptInvite: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      setupTwoFactor: jest.fn(),
      enableTwoFactor: jest.fn(),
      disableTwoFactor: jest.fn(),
      verifyTwoFactor: jest.fn(),
    };
    authenticateUser = new AuthenticateUser(authService);
  });

  it('should return an authenticated result when credentials are valid', async () => {
    // Arrange
    const credentials = { email: 'admin@joker.com', password: 'password123' };
    const mockResult = {
      type: 'authenticated' as const,
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    };
    authService.login.mockResolvedValue(mockResult);

    // Act
    const result = await authenticateUser.execute(credentials);

    // Assert
    expect(result).toEqual(mockResult);
    expect(authService.login).toHaveBeenCalledWith(credentials);
  });

  it('should propagate ApiError when user is not found or invalid', async () => {
    // Arrange
    const credentials = { email: 'unknown@joker.com', password: 'bad' };
    const apiError = new ApiError(400, 'INVALID_CREDENTIALS', 'Invalid credentials');
    authService.login.mockRejectedValue(apiError);

    // Act & Assert
    await expect(authenticateUser.execute(credentials))
      .rejects
      .toThrow(ApiError);
  });
});
