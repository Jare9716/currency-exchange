import { AuthenticateUser } from '@/use-cases/AuthenticateUser';
import { AuthService } from '@/domain/Auth';
import { ApiError } from '@/domain/Errors';

describe('AuthenticateUser', () => {
  let authService: jest.Mocked<AuthService>;
  let authenticateUser: AuthenticateUser;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      refresh: jest.fn(),
    } as jest.Mocked<AuthService>;
    authenticateUser = new AuthenticateUser(authService);
  });

  it('should return tokens when credentials are valid', async () => {
    // Arrange
    const credentials = { email: 'admin@joker.com', password: 'password123' };
    const mockTokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    };
    authService.login.mockResolvedValue(mockTokens);

    // Act
    const result = await authenticateUser.execute(credentials);

    // Assert
    expect(result).toEqual(mockTokens);
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
