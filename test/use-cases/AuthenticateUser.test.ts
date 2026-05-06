import { AuthenticateUser } from '@/use-cases/AuthenticateUser';
import { AuthService } from '@/domain/Employee';
import { DomainError } from '@/domain/Errors';

describe('AuthenticateUser', () => {
  let authService: jest.Mocked<AuthService>;
  let authenticateUser: AuthenticateUser;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
    } as jest.Mocked<AuthService>;
    authenticateUser = new AuthenticateUser(authService);
  });

  it('should return an employee when credentials are valid', async () => {
    // Arrange
    const email = 'admin@joker.com';
    const mockEmployee = {
      id: 'emp-1',
      email,
      name: 'Admin User',
      token: 'valid-token',
    };
    authService.login.mockResolvedValue(mockEmployee);

    // Act
    const result = await authenticateUser.execute(email);

    // Assert
    expect(result).toEqual(mockEmployee);
    expect(authService.login).toHaveBeenCalledWith(email);
  });

  it('should throw a DomainError when user is not found', async () => {
    // Arrange
    const email = 'unknown@joker.com';
    authService.login.mockResolvedValue(undefined);

    // Act & Assert
    await expect(authenticateUser.execute(email))
      .rejects
      .toThrow(DomainError);
    
    try {
      await authenticateUser.execute(email);
    } catch (error) {
      if (error instanceof DomainError) {
        expect(error.code).toBe('user_not_found');
      }
    }
  });
});
